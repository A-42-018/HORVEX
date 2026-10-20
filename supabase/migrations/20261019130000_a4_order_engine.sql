-- WRISTORY · Phase A4 — order engine (roadmap §6.7, §6.8, §9.4 Security)
-- Public RPCs (anon + authenticated):
--   quote_order(...)  → server-calculated totals for the checkout summary and coupon field
--   place_order(...)  → validates, re-prices, decrements stock, writes the order
--   track_order(...)  → phone + order number → status timeline and limited order fields
-- Everything else here is internal. Errors are raised with errcode P0001 and a stable
-- snake_case token as the message (PostgREST → HTTP 400 { code, message, details }):
--   empty_cart · too_many_items · invalid_item · variant_required · product_unavailable
--   out_of_stock · invalid_zone · invalid_coupon · coupon_min_order
--   invalid_name · invalid_phone · invalid_address · invalid_email · invalid_note
--   rate_limited · order_rejected (blocked phone or honeypot; deliberately vague)

-- Sequential, human-friendly order numbers: HVX-10001, HVX-10002, …
create sequence public.order_number_seq start with 10001;
revoke all on sequence public.order_number_seq from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- Same rules as normalizePhone() in src/lib/format.js: "01712-345678",
-- "8801712345678", "+880 1712 345678" → "+8801712345678"; anything else → null.
create or replace function public.normalize_bd_phone(p_input text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare d text := regexp_replace(coalesce(p_input, ''), '\D', '', 'g');
begin
  if left(d, 3) = '880' then d := substr(d, 3); end if;
  return case when d ~ '^01[3-9][0-9]{8}$' then '+88' || d end;
end;
$$;

-- Client IP from the PostgREST request headers (best effort: Cloudflare's header
-- first, since the first X-Forwarded-For entry can be set by the client).
create or replace function public.request_ip()
returns inet
language plpgsql
stable
set search_path = ''
as $$
declare
  h   jsonb;
  raw text;
begin
  h := nullif(current_setting('request.headers', true), '')::jsonb;
  raw := coalesce(h ->> 'cf-connecting-ip', h ->> 'x-real-ip',
                  split_part(h ->> 'x-forwarded-for', ',', 1));
  return nullif(trim(raw), '')::inet;
exception when others then
  return null;
end;
$$;

-- Prices a cart entirely from the database. Never trusts anything from the client
-- except product_id, variant_id and qty. Doesn't lock or write; place_order locks
-- the rows first so the values read here are current.
create or replace function public.price_order(p_items jsonb, p_zone_id uuid, p_coupon_code text)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  max_lines  constant int := 20;
  max_qty    constant int := 10;
  it         record;
  p          record;
  v_id       uuid;
  v_name     text;
  v_price    int;
  v_stock    int;
  v_image    uuid;
  img        text;
  unit       int;
  lines      jsonb := '[]'::jsonb;
  subtotal   int := 0;
  discount   int := 0;
  delivery   int;
  threshold  int;
  c_code     text;
  c_type     text;
  c_value    int;
  c_min      int;
  z          record;
  want_code  text := nullif(upper(trim(coalesce(p_coupon_code, ''))), '');
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = 'P0001', message = 'empty_cart';
  end if;
  if jsonb_array_length(p_items) > max_lines then
    raise exception using errcode = 'P0001', message = 'too_many_items';
  end if;
  -- Malformed lines (not objects, bad uuids, fractional qty) fail the cast here.
  begin
    perform count(*) from jsonb_to_recordset(p_items) as x (product_id uuid, variant_id uuid, qty int);
  exception when others then
    raise exception using errcode = 'P0001', message = 'invalid_item';
  end;

  -- Duplicate lines are merged; ordered by id like place_order's row locks.
  for it in
    select x.product_id, x.variant_id, sum(x.qty)::int as qty
    from jsonb_to_recordset(p_items) as x (product_id uuid, variant_id uuid, qty int)
    group by x.product_id, x.variant_id
    order by x.product_id, x.variant_id nulls first
  loop
    if it.product_id is null or it.qty is null or it.qty < 1 or it.qty > max_qty then
      raise exception using errcode = 'P0001', message = 'invalid_item';
    end if;

    select pr.id, pr.name, pr.price, pr.stock into p
    from public.products pr where pr.id = it.product_id and pr.status = 'active';
    if not found then
      raise exception using errcode = 'P0001', message = 'product_unavailable', detail = it.product_id::text;
    end if;

    v_id := null; v_name := null; v_price := null; v_stock := null; v_image := null;
    if it.variant_id is not null then
      select pv.id, pv.name, pv.price_override, pv.stock, pv.image_id
      into v_id, v_name, v_price, v_stock, v_image
      from public.product_variants pv where pv.id = it.variant_id and pv.product_id = p.id;
      if not found then
        raise exception using errcode = 'P0001', message = 'invalid_item', detail = it.variant_id::text;
      end if;
    elsif exists (select 1 from public.product_variants pv where pv.product_id = p.id) then
      raise exception using errcode = 'P0001', message = 'variant_required', detail = p.id::text;
    end if;

    -- Variant image first, then the first studio (non-lifestyle) shot.
    img := null;
    select pi.url into img from public.product_images pi
    where pi.product_id = p.id
    order by (pi.id is not distinct from v_image) desc, pi.is_lifestyle, pi.sort_order
    limit 1;

    unit := coalesce(v_price, p.price);
    subtotal := subtotal + unit * it.qty;
    lines := lines || jsonb_build_object(
      'product_id', p.id, 'variant_id', v_id, 'name', p.name, 'variant_name', v_name,
      'image', img, 'unit_price', unit, 'qty', it.qty, 'line_total', unit * it.qty,
      'stock', case when v_id is null then p.stock else v_stock end);
  end loop;

  if want_code is not null then
    select cp.code, cp.type, cp.value, cp.min_order into c_code, c_type, c_value, c_min
    from public.coupons cp
    where cp.code = want_code and cp.is_active
      and (cp.starts_at is null or cp.starts_at <= now())
      and (cp.ends_at is null or cp.ends_at > now())
      and (cp.max_uses is null or cp.used < cp.max_uses);
    if not found then
      raise exception using errcode = 'P0001', message = 'invalid_coupon';
    end if;
    if subtotal < c_min then
      raise exception using errcode = 'P0001', message = 'coupon_min_order', detail = c_min::text;
    end if;
    discount := case c_type
      when 'percent' then floor(subtotal * c_value / 100.0)::int
      when 'fixed'   then least(c_value, subtotal)
      else 0
    end;
  end if;

  select dz.id, dz.name, dz.charge, dz.eta_text into z
  from public.delivery_zones dz where dz.id = p_zone_id and dz.is_active;
  if not found then
    raise exception using errcode = 'P0001', message = 'invalid_zone';
  end if;

  -- The free-delivery threshold applies to the subtotal after the coupon discount.
  select s.free_delivery_threshold into threshold from public.site_settings s;
  delivery := case
    when c_type = 'free_shipping' or (threshold is not null and subtotal - discount >= threshold) then 0
    else z.charge
  end;

  return jsonb_build_object(
    'lines', lines,
    'subtotal', subtotal,
    'discount', discount,
    'coupon_code', c_code,
    'coupon_type', c_type,
    'zone_id', z.id,
    'zone_name', z.name,
    'eta_text', z.eta_text,
    'delivery_charge', delivery,
    'free_delivery_threshold', threshold,
    'total', subtotal - discount + delivery);
end;
$$;

-- ---------------------------------------------------------------------------
-- quote_order: checkout summary + "Apply coupon". Read-only.
-- p_items: [{ "product_id": uuid, "variant_id": uuid | null, "qty": int }]
-- ---------------------------------------------------------------------------
create or replace function public.quote_order(
  p_items       jsonb,
  p_zone_id     uuid,
  p_coupon_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return public.price_order(p_items, p_zone_id, p_coupon_code);
end;
$$;

-- ---------------------------------------------------------------------------
-- place_order: the only way an order gets created (orders has no INSERT policy).
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_items         jsonb,
  p_zone_id       uuid,
  p_customer_name text,
  p_phone         text,
  p_address       text,
  p_district      text default null,
  p_email         text default null,
  p_note          text default null,
  p_coupon_code   text default null,
  p_website       text default null -- honeypot: a hidden field real customers leave empty
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  phone_limit constant int := 3;  -- orders per phone per hour
  ip_limit    constant int := 10; -- per IP per hour (higher: mobile carriers share IPs)
  v_name    text := regexp_replace(trim(coalesce(p_customer_name, '')), '\s+', ' ', 'g');
  v_phone   text := public.normalize_bd_phone(p_phone);
  v_address text := trim(coalesce(p_address, ''));
  v_email   text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_note    text := nullif(trim(coalesce(p_note, '')), '');
  v_district text := coalesce(nullif(trim(coalesce(p_district, '')), ''), 'Dhaka');
  v_ip      inet := public.request_ip();
  v_ua      text := left(nullif(current_setting('request.headers', true), '')::jsonb ->> 'user-agent', 300);
  q         jsonb;
  line      jsonb;
  o_id      uuid;
  o_number  text;
  o_created timestamptz;
  n         int;
begin
  if nullif(trim(coalesce(p_website, '')), '') is not null then
    raise exception using errcode = 'P0001', message = 'order_rejected';
  end if;

  if char_length(v_name) not between 2 and 80 then
    raise exception using errcode = 'P0001', message = 'invalid_name';
  end if;
  if v_phone is null then
    raise exception using errcode = 'P0001', message = 'invalid_phone';
  end if;
  if char_length(v_address) not between 5 and 300 then
    raise exception using errcode = 'P0001', message = 'invalid_address';
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception using errcode = 'P0001', message = 'invalid_email';
  end if;
  if char_length(v_note) > 500 then
    raise exception using errcode = 'P0001', message = 'invalid_note';
  end if;
  v_district := left(v_district, 60);

  if exists (select 1 from public.blocked_phones b where b.phone = v_phone) then
    raise exception using errcode = 'P0001', message = 'order_rejected';
  end if;

  -- Serialize orders from the same phone / IP so parallel requests can't slip past the limit.
  perform pg_advisory_xact_lock(hashtextextended('hvx-order-phone:' || v_phone, 0));
  select count(*) into n from public.orders o
  where o.phone = v_phone and o.created_at > now() - interval '1 hour';
  if n >= phone_limit then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;
  if v_ip is not null then
    perform pg_advisory_xact_lock(hashtextextended('hvx-order-ip:' || host(v_ip), 0));
    select count(*) into n from public.orders o
    where o.ip = v_ip and o.created_at > now() - interval '1 hour';
    if n >= ip_limit then
      raise exception using errcode = 'P0001', message = 'rate_limited';
    end if;
  end if;

  -- Lock the stock rows (in id order, to avoid deadlocks) and the coupon, then price.
  -- After waiting on a lock, the next statement sees the committed stock.
  if jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) <= 20 then
    begin
      perform 1 from public.products pr
      where pr.id in (select (e ->> 'product_id')::uuid from jsonb_array_elements(p_items) e)
      order by pr.id for update;
      perform 1 from public.product_variants pv
      where pv.id in (select (e ->> 'variant_id')::uuid from jsonb_array_elements(p_items) e)
      order by pv.id for update;
    exception when invalid_text_representation then
      raise exception using errcode = 'P0001', message = 'invalid_item';
    end;
  end if;
  perform 1 from public.coupons cp
  where cp.code = nullif(upper(trim(coalesce(p_coupon_code, ''))), '') for update;

  q := public.price_order(p_items, p_zone_id, p_coupon_code);

  for line in select * from jsonb_array_elements(q -> 'lines') loop
    if (line ->> 'qty')::int > (line ->> 'stock')::int then
      raise exception using errcode = 'P0001', message = 'out_of_stock', detail = line ->> 'product_id';
    end if;
    if line ->> 'variant_id' is null then
      update public.products set stock = stock - (line ->> 'qty')::int
      where id = (line ->> 'product_id')::uuid;
    else
      update public.product_variants set stock = stock - (line ->> 'qty')::int
      where id = (line ->> 'variant_id')::uuid;
    end if;
  end loop;

  if q ->> 'coupon_code' is not null then
    update public.coupons set used = used + 1 where code = q ->> 'coupon_code';
  end if;

  insert into public.orders (
    order_number, customer_name, phone, email, address, district, zone_id,
    delivery_charge, subtotal, discount, coupon_code, total, customer_note, ip, user_agent)
  values (
    'HVX-' || nextval('public.order_number_seq'), v_name, v_phone, v_email, v_address, v_district,
    (q ->> 'zone_id')::uuid, (q ->> 'delivery_charge')::int, (q ->> 'subtotal')::int,
    (q ->> 'discount')::int, q ->> 'coupon_code', (q ->> 'total')::int, v_note, v_ip, v_ua)
  returning id, order_number, created_at into o_id, o_number, o_created;

  insert into public.order_items (
    order_id, product_id, variant_id, name_snapshot, variant_snapshot, image_snapshot, unit_price, qty)
  select o_id, (l ->> 'product_id')::uuid, (l ->> 'variant_id')::uuid, l ->> 'name',
         l ->> 'variant_name', l ->> 'image', (l ->> 'unit_price')::int, (l ->> 'qty')::int
  from jsonb_array_elements(q -> 'lines') l;

  -- Everything the success page needs; stock counts are dropped from the lines.
  return jsonb_build_object(
    'order_id', o_id,
    'order_number', o_number,
    'created_at', o_created,
    'customer_name', v_name,
    'lines', (select jsonb_agg(l - 'stock') from jsonb_array_elements(q -> 'lines') l),
    'subtotal', q -> 'subtotal',
    'discount', q -> 'discount',
    'coupon_code', q -> 'coupon_code',
    'delivery_charge', q -> 'delivery_charge',
    'zone_name', q -> 'zone_name',
    'eta_text', q -> 'eta_text',
    'total', q -> 'total');
end;
$$;

-- ---------------------------------------------------------------------------
-- track_order: phone + order number → status and limited fields (no address,
-- email, notes or staff names). Returns null when nothing matches.
-- ---------------------------------------------------------------------------
create or replace function public.track_order(p_phone text, p_order_number text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_phone  text := public.normalize_bd_phone(p_phone);
  v_number text := upper(regexp_replace(coalesce(p_order_number, ''), '\s', '', 'g'));
  o        record;
begin
  if v_phone is null or v_number = '' then
    return null;
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

-- ---------------------------------------------------------------------------
-- Privileges: only the three RPCs are callable from the API.
-- ---------------------------------------------------------------------------
revoke execute on function
  public.normalize_bd_phone(text),
  public.request_ip(),
  public.price_order(jsonb, uuid, text),
  public.quote_order(jsonb, uuid, text),
  public.place_order(jsonb, uuid, text, text, text, text, text, text, text, text),
  public.track_order(text, text)
from public, anon, authenticated;

grant execute on function
  public.quote_order(jsonb, uuid, text),
  public.place_order(jsonb, uuid, text, text, text, text, text, text, text, text),
  public.track_order(text, text)
to anon, authenticated;
