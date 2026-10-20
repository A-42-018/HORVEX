-- WRISTORY · Phase C5 — fixes from the security audit (roadmap §9.4 Security)
-- 1. Orders: the admin UI only changes status, courier, tracking ID and the admin
--    note, so those are the only columns the API may update. Totals, coupon,
--    customer details and order numbers can't be rewritten from the browser.
-- 2. Restock on cancel/return happens once per order. Before this, cancelled →
--    pending → cancelled gave the stock (and the coupon use) back twice.
-- 3. Abuse limits on the public endpoints, counted in request_attempts:
--    track_order misses (order-number guessing), coupon misses (code guessing,
--    through quote_order and place_order) and the contact / newsletter forms.
-- Apply after 20261020150000_admin_list_offsets.sql. Test: tests/c5_security_check.sql.

-- ---------------------------------------------------------------------------
-- 1. Column-level update rights on orders
-- ---------------------------------------------------------------------------
revoke update on public.orders from authenticated;
grant update (status, courier, tracking_id, admin_note) on public.orders to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Restock once
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists stock_restored boolean not null default false;

-- Orders that are already cancelled/returned have had their stock back.
-- (updated_at trigger paused so the backfill doesn't touch the admin timestamps)
alter table public.orders disable trigger orders_updated_at;
update public.orders set stock_restored = true where status in ('cancelled', 'returned');
alter table public.orders enable trigger orders_updated_at;

create or replace function public.restock_cancelled_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status not in ('cancelled', 'returned') or old.status in ('cancelled', 'returned')
     or old.stock_restored then
    return new;
  end if;

  perform 1 from public.products pr
  where pr.id in (
    select oi.product_id from public.order_items oi
    where oi.order_id = new.id and oi.variant_id is null and oi.variant_snapshot is null
  )
  order by pr.id for update;
  perform 1 from public.product_variants pv
  where pv.id in (select oi.variant_id from public.order_items oi where oi.order_id = new.id)
  order by pv.id for update;

  update public.product_variants pv
  set stock = pv.stock + items.qty
  from (
    select oi.variant_id, sum(oi.qty)::int as qty
    from public.order_items oi
    where oi.order_id = new.id and oi.variant_id is not null
    group by oi.variant_id
  ) items
  where pv.id = items.variant_id;

  update public.products pr
  set stock = pr.stock + items.qty
  from (
    select oi.product_id, sum(oi.qty)::int as qty
    from public.order_items oi
    where oi.order_id = new.id and oi.variant_id is null and oi.variant_snapshot is null and oi.product_id is not null
    group by oi.product_id
  ) items
  where pr.id = items.product_id;

  if new.coupon_code is not null then
    update public.coupons set used = greatest(used - 1, 0) where code = new.coupon_code;
  end if;

  -- Not in the API's update grant, so only this trigger sets it.
  update public.orders set stock_restored = true where id = new.id;
  return new;
end;
$$;

revoke all on function public.restock_cancelled_order() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Abuse limits
-- ---------------------------------------------------------------------------
-- Internal: no policies and no grants, so the API can't read or write it.
create table if not exists public.request_attempts (
  id         bigint generated always as identity primary key,
  kind       text not null,
  key        text not null,
  created_at timestamptz not null default now()
);
create index if not exists request_attempts_lookup_idx on public.request_attempts (kind, key, created_at desc);
alter table public.request_attempts enable row level security;
revoke all on public.request_attempts from public, anon, authenticated;

-- True when `key` already has `max_count` attempts of this kind inside the window.
create or replace function public.attempts_exceeded(p_kind text, p_key text, p_max integer, p_window interval)
returns boolean
language sql
stable
set search_path = ''
as $$
  select count(*) >= p_max from public.request_attempts a
  where a.kind = p_kind and a.key = p_key and a.created_at > now() - p_window;
$$;

-- Records one attempt; now and then drops rows older than a day (no limit looks further back).
create or replace function public.note_attempt(p_kind text, p_key text)
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  insert into public.request_attempts (kind, key) values (p_kind, p_key);
  if random() < 0.02 then
    delete from public.request_attempts where created_at < now() - interval '1 day';
  end if;
end;
$$;

revoke execute on function
  public.attempts_exceeded(text, text, integer, interval),
  public.note_attempt(text, text)
from public, anon, authenticated;

-- track_order: same result as A4, but misses are counted: 20 per phone per day
-- and 30 per IP per hour, then rate_limited until the window passes. Found
-- orders don't count, so a customer re-checking their order is never blocked.
create or replace function public.track_order(p_phone text, p_order_number text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_phone  text := public.normalize_bd_phone(p_phone);
  v_number text := upper(regexp_replace(coalesce(p_order_number, ''), '\s', '', 'g'));
  v_ip     text := host(public.request_ip());
  o        record;
begin
  if v_phone is null or v_number = '' then
    return null;
  end if;
  if public.attempts_exceeded('track_miss_phone', v_phone, 20, interval '1 day')
     or (v_ip is not null and public.attempts_exceeded('track_miss_ip', v_ip, 30, interval '1 hour')) then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;
  if v_number !~ '^HVX-' then
    v_number := 'HVX-' || regexp_replace(v_number, '^HVX', '');
  end if;

  select ord.id, ord.order_number, ord.status, ord.created_at, ord.subtotal, ord.discount,
         ord.delivery_charge, ord.total, ord.courier, ord.tracking_id, dz.name as zone_name, dz.eta_text
  into o
  from public.orders ord
  left join public.delivery_zones dz on dz.id = ord.zone_id
  where ord.order_number = v_number and ord.phone = v_phone;
  if not found then
    perform public.note_attempt('track_miss_phone', v_phone);
    if v_ip is not null then
      perform public.note_attempt('track_miss_ip', v_ip);
    end if;
    return null;
  end if;

  return jsonb_build_object(
    'order_number', o.order_number,
    'status', o.status,
    'placed_at', o.created_at,
    'subtotal', o.subtotal,
    'discount', o.discount,
    'delivery_charge', o.delivery_charge,
    'total', o.total,
    'zone_name', o.zone_name,
    'eta_text', o.eta_text,
    'courier', o.courier,
    'tracking_id', o.tracking_id,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', oi.name_snapshot, 'variant_name', oi.variant_snapshot, 'image', oi.image_snapshot,
        'unit_price', oi.unit_price, 'qty', oi.qty) order by oi.name_snapshot)
      from public.order_items oi where oi.order_id = o.id), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object('status', h.to_status, 'at', h.created_at) order by h.created_at)
      from public.order_status_history h where h.order_id = o.id), '[]'::jsonb));
end;
$$;

-- Coupon guessing. A raised error would roll back the attempt row, so with a
-- known IP an unknown code comes back as a normal result { "error": "invalid_coupon" }
-- (services/orders.js turns it into the usual error). After 10 misses per IP
-- per hour every code is refused as invalid_coupon, valid ones included.
create or replace function public.coupon_locked(p_coupon_code text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select nullif(trim(coalesce(p_coupon_code, '')), '') is not null
     and host(public.request_ip()) is not null
     and public.attempts_exceeded('coupon_miss', host(public.request_ip()), 10, interval '1 hour');
$$;

revoke execute on function public.coupon_locked(text) from public, anon, authenticated;

create or replace function public.quote_order(
  p_items       jsonb,
  p_zone_id     uuid,
  p_coupon_code text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ip text := host(public.request_ip());
begin
  if public.coupon_locked(p_coupon_code) then
    raise exception using errcode = 'P0001', message = 'invalid_coupon';
  end if;
  begin
    return public.price_order(p_items, p_zone_id, p_coupon_code);
  exception when raise_exception then
    if sqlerrm = 'invalid_coupon' and v_ip is not null then
      perform public.note_attempt('coupon_miss', v_ip);
      return jsonb_build_object('error', 'invalid_coupon');
    end if;
    raise;
  end;
end;
$$;

-- place_order: the B29b body moves to place_order_checked (internal); the public
-- place_order wraps it with the coupon limit. A failed inner call rolls back all
-- of its work (stock, coupon use, order) before the miss is recorded.
alter function public.place_order(jsonb, uuid, text, text, text, text, text, text, text, text)
  rename to place_order_checked;
revoke execute on function public.place_order_checked(jsonb, uuid, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;

create function public.place_order(
  p_items         jsonb,
  p_zone_id       uuid,
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_district      text default null,
  p_email         text default null,
  p_note          text default null,
  p_coupon_code   text default null,
  p_website       text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ip text := host(public.request_ip());
begin
  if public.coupon_locked(p_coupon_code) then
    raise exception using errcode = 'P0001', message = 'invalid_coupon';
  end if;
  begin
    return public.place_order_checked(p_items, p_zone_id, p_customer_name, p_phone, p_address,
                                      p_district, p_email, p_note, p_coupon_code, p_website);
  exception when raise_exception then
    if sqlerrm = 'invalid_coupon' and v_ip is not null then
      perform public.note_attempt('coupon_miss', v_ip);
      return jsonb_build_object('error', 'invalid_coupon');
    end if;
    raise;
  end;
end;
$$;

revoke execute on function public.place_order(jsonb, uuid, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.place_order(jsonb, uuid, text, text, text, text, text, text, text, text)
  to anon, authenticated;
grant execute on function public.quote_order(jsonb, uuid, text) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- Contact form and newsletter: 5 submissions per IP per 10 minutes each.
create or replace function public.limit_inbound_form()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip   text := host(public.request_ip());
  v_kind text := 'form_' || tg_table_name;
begin
  if v_ip is null then
    return new;
  end if;
  if public.attempts_exceeded(v_kind, v_ip, 5, interval '10 minutes') then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;
  perform public.note_attempt(v_kind, v_ip);
  return new;
end;
$$;

revoke all on function public.limit_inbound_form() from public, anon, authenticated;

drop trigger if exists contact_messages_rate_limit on public.contact_messages;
create trigger contact_messages_rate_limit
  before insert on public.contact_messages
  for each row execute function public.limit_inbound_form();

drop trigger if exists subscribers_rate_limit on public.subscribers;
create trigger subscribers_rate_limit
  before insert on public.subscribers
  for each row execute function public.limit_inbound_form();

notify pgrst, 'reload schema';
