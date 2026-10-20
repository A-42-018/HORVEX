-- B29b: site settings.
-- 1) place_order refuses orders while site_settings.maintenance_mode is on
--    (error token `maintenance`). Same function as A4 plus one check.
-- 2) Managers may edit the announcement bar and the free-delivery amount without
--    owning the rest of site_settings (RLS keeps every other column owner-only):
--    two narrow security-definer functions, manager+ only.

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

  -- B29b: maintenance mode closes ordering (the storefront shows a notice too).
  if exists (select 1 from public.site_settings s where s.maintenance_mode) then
    raise exception using errcode = 'P0001', message = 'maintenance';
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
-- Manager-level writes on two site_settings columns
-- ---------------------------------------------------------------------------
create or replace function public.set_announcements(p_messages jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  m jsonb;
  result jsonb;
begin
  if not public.is_manager() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if jsonb_typeof(p_messages) is distinct from 'array' or jsonb_array_length(p_messages) > 8 then
    raise exception using errcode = 'P0001', message = 'invalid_announcements';
  end if;
  for m in select * from jsonb_array_elements(p_messages) loop
    if jsonb_typeof(m) is distinct from 'object'
       or jsonb_typeof(m -> 'text') is distinct from 'string'
       or char_length(btrim(m ->> 'text')) not between 1 and 90
       or (m ? 'link' and (jsonb_typeof(m -> 'link') is distinct from 'string' or char_length(m ->> 'link') > 200)) then
      raise exception using errcode = 'P0001', message = 'invalid_announcements';
    end if;
  end loop;
  update public.site_settings set announcements = p_messages where id returning announcements into result;
  return result;
end;
$$;

create or replace function public.set_free_delivery_threshold(p_amount integer)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  result integer;
begin
  if not public.is_manager() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if p_amount is not null and (p_amount < 0 or p_amount > 10000000) then
    raise exception using errcode = 'P0001', message = 'invalid_threshold';
  end if;
  update public.site_settings set free_delivery_threshold = p_amount where id returning free_delivery_threshold into result;
  return result;
end;
$$;

revoke all on function public.set_announcements(jsonb) from public, anon;
revoke all on function public.set_free_delivery_threshold(integer) from public, anon;
grant execute on function public.set_announcements(jsonb) to authenticated;
grant execute on function public.set_free_delivery_threshold(integer) to authenticated;
