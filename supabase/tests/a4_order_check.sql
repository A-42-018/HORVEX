-- WRISTORY · Phase A4 — order engine check. Paste into the Supabase SQL Editor and Run.
-- Creates throwaway fixtures ("zz-a4" slugs/names, phones +88017110040xx), then calls
-- quote_order / place_order / track_order as anon, the way the storefront will.
-- Fixtures and test orders are deleted at the end and the order-number sequence is
-- rewound. If any check fails, the whole run is rolled back and the error names it.
-- Doesn't depend on seed.sql. Expected result: one row, "A4 order checks passed".

create or replace function pg_temp.expect(label text, ok boolean) returns void
language plpgsql as $$
begin
  if ok is not true then
    raise exception 'A4 order check failed: %', label;
  end if;
end;
$$;

-- The error token a statement raises, or 'ok'.
create or replace function pg_temp.err(q text) returns text
language plpgsql as $$
begin
  execute q;
  return 'ok';
exception
  when insufficient_privilege then return 'denied';
  when others then return sqlerrm;
end;
$$;

create or replace function pg_temp.act_as(r text, uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('role', r, 'sub', uid)::text, true);
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  perform set_config('role', r, true);
end;
$$;

-- Builds a place_order call. items: [{product_id, variant_id?, qty, ...}]
create or replace function pg_temp.order_sql(
  items jsonb, zone uuid, phone text,
  coupon text default null, honeypot text default null, name text default 'zz-a4 buyer'
) returns text
language sql as $$
  select format(
    'select public.place_order(p_items => %L, p_zone_id => %L, p_customer_name => %L, p_phone => %L,
       p_address => %L, p_district => %L, p_coupon_code => %L, p_website => %L)',
    items, zone, name, phone, 'House 4, Road 7, Dhanmondi', 'Dhaka', coupon, honeypot)
$$;

create or replace function pg_temp.place(
  items jsonb, zone uuid, phone text, coupon text default null
) returns jsonb
language plpgsql as $$
declare r jsonb;
begin
  execute pg_temp.order_sql(items, zone, phone, coupon) into r;
  return r;
end;
$$;

do $$
declare
  me       text := current_user;
  thr0     int;
  c_id     uuid;
  p_watch  uuid;  -- ৳5,000, stock 100
  p_scarce uuid;  -- ৳3,000, stock 2
  p_var    uuid;  -- has variants, ৳4,000 base
  p_draft  uuid;
  v_plain  uuid;  -- no price override, stock 5
  v_dear   uuid;  -- ৳4,500 override, stock 1
  v_other  uuid;  -- variant of another product
  z_dhaka  uuid;  -- ৳70
  z_off    uuid;  -- inactive
  r        jsonb;
  t        jsonb;
  o_num    text;
  i        int;
begin
  -- Fixtures (as the SQL Editor's own role) ------------------------------------
  select free_delivery_threshold into thr0 from public.site_settings;
  update public.site_settings set free_delivery_threshold = 20000 where id;

  insert into public.categories (slug, name) values ('zz-a4-cat', 'zz-a4') returning id into c_id;
  insert into public.products (slug, name, price, stock, status, category_id)
    values ('zz-a4-watch', 'zz-a4 Watch', 5000, 100, 'active', c_id) returning id into p_watch;
  insert into public.products (slug, name, price, stock, status, category_id)
    values ('zz-a4-scarce', 'zz-a4 Scarce', 3000, 2, 'active', c_id) returning id into p_scarce;
  insert into public.products (slug, name, price, stock, status, category_id)
    values ('zz-a4-variant', 'zz-a4 Variant', 4000, 6, 'active', c_id) returning id into p_var;
  insert into public.products (slug, name, price, stock, status, category_id)
    values ('zz-a4-draft', 'zz-a4 Draft', 1000, 10, 'draft', c_id) returning id into p_draft;
  insert into public.product_images (product_id, url, is_lifestyle, sort_order) values
    (p_watch, 'zz-a4-lifestyle.jpg', true, 0), (p_watch, 'zz-a4-front.jpg', false, 1);
  insert into public.product_variants (product_id, name, stock) values (p_var, 'Steel', 5) returning id into v_plain;
  insert into public.product_variants (product_id, name, stock, price_override)
    values (p_var, 'Gold', 1, 4500) returning id into v_dear;
  insert into public.product_variants (product_id, name, stock)
    values (p_draft, 'Other', 5) returning id into v_other;

  insert into public.delivery_zones (name, charge, eta_text) values ('zz-a4 Dhaka', 70, '1–2 days') returning id into z_dhaka;
  insert into public.delivery_zones (name, charge, is_active) values ('zz-a4 off', 50, false) returning id into z_off;

  insert into public.coupons (code, type, value, min_order) values
    ('ZZA4-PCT', 'percent', 10, 0), ('ZZA4-FIX', 'fixed', 700, 0), ('ZZA4-SHIP', 'free_shipping', 0, 0),
    ('ZZA4-MIN', 'fixed', 100, 99999);
  insert into public.coupons (code, type, value, max_uses, used) values ('ZZA4-USED', 'fixed', 100, 1, 1);
  insert into public.coupons (code, type, value, starts_at, ends_at)
    values ('ZZA4-OLD', 'fixed', 100, now() - interval '10 days', now() - interval '1 day');
  insert into public.coupons (code, type, value, is_active) values ('ZZA4-OFF', 'fixed', 100, false);

  insert into public.blocked_phones (phone, reason) values ('+8801711004099', 'zz-a4');

  -- Privileges -------------------------------------------------------------------
  perform pg_temp.act_as('anon', null);
  perform pg_temp.expect('anon cannot call internal price_order', pg_temp.err(format(
    'select public.price_order(%L, %L, null)', jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 1)), z_dhaka)) = 'denied');
  perform pg_temp.expect('anon cannot read coupons', pg_temp.err('select 1 from public.coupons') = 'denied');
  perform pg_temp.expect('anon cannot insert orders directly', pg_temp.err(
    'insert into public.orders (order_number, customer_name, phone, address, district, subtotal, total)
     values (''HVX-ZZA4Z'', ''zz-a4 z'', ''+8801711004000'', ''House 4, Road 4'', ''Dhaka'', 1, 1)') = 'denied');

  -- Tampered prices are ignored ------------------------------------------------------
  t := jsonb_build_array(jsonb_build_object(
    'product_id', p_watch, 'qty', 2, 'price', 1, 'unit_price', 1, 'total', 1, 'subtotal', 1));
  execute format('select public.quote_order(%L, %L)', t, z_dhaka) into r;
  perform pg_temp.expect('quote re-prices from the DB', (r ->> 'subtotal')::int = 10000
    and (r ->> 'delivery_charge')::int = 70 and (r ->> 'total')::int = 10070);

  r := pg_temp.place(t, z_dhaka, '01711-004001');
  perform pg_temp.expect('order number format', r ->> 'order_number' ~ '^HVX-[0-9]{5,}$');
  perform pg_temp.expect('tampered order charged DB prices', (r ->> 'total')::int = 10070);
  perform set_config('role', me, true);
  perform pg_temp.expect('stored order uses DB prices', exists (
    select 1 from public.orders o
    where o.order_number = r ->> 'order_number' and o.subtotal = 10000 and o.total = 10070
      and o.delivery_charge = 70 and o.phone = '+8801711004001' and o.status = 'pending'));
  perform pg_temp.expect('order item snapshot', exists (
    select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.order_number = r ->> 'order_number' and oi.unit_price = 5000 and oi.qty = 2
      and oi.name_snapshot = 'zz-a4 Watch' and oi.image_snapshot = 'zz-a4-front.jpg'));
  perform pg_temp.expect('stock decremented', (select stock from public.products where id = p_watch) = 98);
  perform pg_temp.expect('first status logged', exists (
    select 1 from public.order_status_history h join public.orders o on o.id = h.order_id
    where o.order_number = r ->> 'order_number' and h.to_status = 'pending'));
  o_num := r ->> 'order_number';

  -- Stock can't go negative ------------------------------------------------------------
  perform pg_temp.act_as('anon', null);
  perform pg_temp.expect('ordering more than stock is refused', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_scarce, 'qty', 3)), z_dhaka, '01711004002')) = 'out_of_stock');
  perform pg_temp.expect('duplicate lines are summed before the stock check', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_scarce, 'qty', 2),
                      jsonb_build_object('product_id', p_scarce, 'qty', 1)), z_dhaka, '01711004002')) = 'out_of_stock');
  perform pg_temp.expect('a failed order changes no stock', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 1),
                      jsonb_build_object('product_id', p_scarce, 'qty', 5)), z_dhaka, '01711004002')) = 'out_of_stock');
  perform set_config('role', me, true);
  perform pg_temp.expect('stock untouched after refusals',
    (select stock from public.products where id = p_watch) = 98
    and (select stock from public.products where id = p_scarce) = 2);
  perform pg_temp.act_as('anon', null);
  r := pg_temp.place(jsonb_build_array(jsonb_build_object('product_id', p_scarce, 'qty', 2)), z_dhaka, '01711004003');
  perform pg_temp.expect('last units can be bought', (r ->> 'subtotal')::int = 6000);
  perform pg_temp.expect('sold out after that', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_scarce, 'qty', 1)), z_dhaka, '01711004004')) = 'out_of_stock');
  perform set_config('role', me, true);
  perform pg_temp.expect('stock is zero, not negative', (select stock from public.products where id = p_scarce) = 0);
  perform pg_temp.expect('the table itself refuses negative stock', pg_temp.err(format(
    'update public.products set stock = stock - 1 where id = %L', p_scarce)) like '%check constraint%');

  -- Variants ------------------------------------------------------------------------------
  perform pg_temp.act_as('anon', null);
  perform pg_temp.expect('product with variants needs one', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_var, 'qty', 1)), z_dhaka, '01711004005')) = 'variant_required');
  perform pg_temp.expect('variant must belong to the product', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_var, 'variant_id', v_other, 'qty', 1)), z_dhaka, '01711004005')) = 'invalid_item');
  r := pg_temp.place(jsonb_build_array(
    jsonb_build_object('product_id', p_var, 'variant_id', v_dear, 'qty', 1, 'unit_price', 1),
    jsonb_build_object('product_id', p_var, 'variant_id', v_plain, 'qty', 2)), z_dhaka, '01711004005');
  perform pg_temp.expect('variant price override used', (r ->> 'subtotal')::int = 4500 + 2 * 4000);
  perform set_config('role', me, true);
  perform pg_temp.expect('variant stock decremented',
    (select stock from public.product_variants where id = v_dear) = 0
    and (select stock from public.product_variants where id = v_plain) = 3);
  perform pg_temp.act_as('anon', null);
  perform pg_temp.expect('sold-out variant refused', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_var, 'variant_id', v_dear, 'qty', 1)), z_dhaka, '01711004006')) = 'out_of_stock');

  -- Catalog, zone and input validation ---------------------------------------------------------
  perform pg_temp.expect('draft product refused', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_draft, 'qty', 1)), z_dhaka, '01711004006')) = 'product_unavailable');
  perform pg_temp.expect('unknown product refused', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', gen_random_uuid(), 'qty', 1)), z_dhaka, '01711004006')) = 'product_unavailable');
  perform pg_temp.expect('inactive zone refused', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 1)), z_off, '01711004006')) = 'invalid_zone');
  perform pg_temp.expect('empty cart refused', pg_temp.err(pg_temp.order_sql(
    '[]'::jsonb, z_dhaka, '01711004006')) = 'empty_cart');
  perform pg_temp.expect('qty 0 refused', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 0)), z_dhaka, '01711004006')) = 'invalid_item');
  perform pg_temp.expect('negative qty refused', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', -3)), z_dhaka, '01711004006')) = 'invalid_item');
  perform pg_temp.expect('qty above 10 refused', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 11)), z_dhaka, '01711004006')) = 'invalid_item');
  perform pg_temp.expect('malformed item refused', pg_temp.err(pg_temp.order_sql(
    '[{"product_id": "not-a-uuid", "qty": 1}]'::jsonb, z_dhaka, '01711004006')) = 'invalid_item');
  perform pg_temp.expect('invalid phone refused', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 1)), z_dhaka, '01211004006')) = 'invalid_phone');
  perform pg_temp.expect('one-letter name refused', pg_temp.err(pg_temp.order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 1)), z_dhaka, '01711004006', name => 'Z')) = 'invalid_name');

  -- Coupons --------------------------------------------------------------------------------------
  t := jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 1));
  execute format('select public.quote_order(%L, %L, %L)', t, z_dhaka, ' zza4-pct ') into r;
  perform pg_temp.expect('percent coupon (code is trimmed and upper-cased)',
    (r ->> 'discount')::int = 500 and (r ->> 'total')::int = 4570 and r ->> 'coupon_code' = 'ZZA4-PCT');
  execute format('select public.quote_order(%L, %L, %L)', t, z_dhaka, 'ZZA4-FIX') into r;
  perform pg_temp.expect('fixed coupon', (r ->> 'discount')::int = 700 and (r ->> 'total')::int = 4370);
  execute format('select public.quote_order(%L, %L, %L)', t, z_dhaka, 'ZZA4-SHIP') into r;
  perform pg_temp.expect('free-shipping coupon', (r ->> 'delivery_charge')::int = 0 and (r ->> 'total')::int = 5000);
  perform pg_temp.expect('min-order coupon refused', pg_temp.err(format(
    'select public.quote_order(%L, %L, %L)', t, z_dhaka, 'ZZA4-MIN')) = 'coupon_min_order');
  perform pg_temp.expect('used-up coupon refused', pg_temp.err(format(
    'select public.quote_order(%L, %L, %L)', t, z_dhaka, 'ZZA4-USED')) = 'invalid_coupon');
  perform pg_temp.expect('expired coupon refused', pg_temp.err(format(
    'select public.quote_order(%L, %L, %L)', t, z_dhaka, 'ZZA4-OLD')) = 'invalid_coupon');
  perform pg_temp.expect('inactive coupon refused', pg_temp.err(format(
    'select public.quote_order(%L, %L, %L)', t, z_dhaka, 'ZZA4-OFF')) = 'invalid_coupon');
  perform pg_temp.expect('unknown coupon refused', pg_temp.err(format(
    'select public.quote_order(%L, %L, %L)', t, z_dhaka, 'NOPE-ZZA4')) = 'invalid_coupon');
  r := pg_temp.place(t, z_dhaka, '01711004007', 'ZZA4-PCT');
  perform pg_temp.expect('coupon applied to the order', (r ->> 'total')::int = 4570);
  perform set_config('role', me, true);
  perform pg_temp.expect('placing (not quoting) counts a coupon use',
    (select used from public.coupons where code = 'ZZA4-PCT') = 1);

  -- Free-delivery threshold (on the subtotal after discount) ----------------------------------------
  update public.site_settings set free_delivery_threshold = 9500 where id;
  perform pg_temp.act_as('anon', null);
  execute format('select public.quote_order(%L, %L)',
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 2)), z_dhaka) into r;
  perform pg_temp.expect('free delivery over the threshold', (r ->> 'delivery_charge')::int = 0);
  execute format('select public.quote_order(%L, %L, %L)',
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 2)), z_dhaka, 'ZZA4-PCT') into r;
  perform pg_temp.expect('no free delivery once the discount drops it below', (r ->> 'delivery_charge')::int = 70);
  perform set_config('role', me, true);
  update public.site_settings set free_delivery_threshold = 20000 where id;

  -- Block list and honeypot ------------------------------------------------------------------------
  perform pg_temp.act_as('anon', null);
  perform pg_temp.expect('blocked phone refused (any format)', pg_temp.err(pg_temp.order_sql(
    t, z_dhaka, '+880 1711-004099')) = 'order_rejected');
  perform pg_temp.expect('filled honeypot refused', pg_temp.err(pg_temp.order_sql(
    t, z_dhaka, '01711004008', honeypot => 'https://spam.example')) = 'order_rejected');

  -- Rate limits --------------------------------------------------------------------------------------
  for i in 1..3 loop
    perform pg_temp.place(t, z_dhaka, '01711004010');
  end loop;
  perform pg_temp.expect('4th order from one phone within the hour refused', pg_temp.err(pg_temp.order_sql(
    t, z_dhaka, '01711004010')) = 'rate_limited');

  perform set_config('request.headers', '{"cf-connecting-ip": "203.0.113.44", "user-agent": "zz-a4"}', true);
  for i in 1..10 loop
    perform pg_temp.place(t, z_dhaka, format('017110040%s', 20 + i));
  end loop;
  perform pg_temp.expect('11th order from one IP within the hour refused', pg_temp.err(pg_temp.order_sql(
    t, z_dhaka, '01711004040')) = 'rate_limited');
  perform set_config('request.headers', '', true);
  perform set_config('role', me, true);
  perform pg_temp.expect('IP and user agent recorded', (
    select count(*) from public.orders where ip = '203.0.113.44'::inet and user_agent = 'zz-a4') = 10);

  -- track_order ---------------------------------------------------------------------------------------
  perform pg_temp.act_as('anon', null);
  execute format('select public.track_order(%L, %L)', '01711-004001', lower(o_num)) into r;
  perform pg_temp.expect('track by phone + number (any format)',
    r ->> 'order_number' = o_num and r ->> 'status' = 'pending'
    and jsonb_array_length(r -> 'history') = 1 and jsonb_array_length(r -> 'items') = 1
    and (r ->> 'total')::int = 10070);
  perform pg_temp.expect('track returns no address, phone, name or notes',
    not (r ?| array['address', 'phone', 'customer_name', 'email', 'admin_note', 'customer_note', 'ip']));
  execute format('select public.track_order(%L, %L)', '01711-004001', replace(o_num, 'HVX-', '')) into r;
  perform pg_temp.expect('track accepts the number without HVX-', r ->> 'order_number' = o_num);
  execute format('select public.track_order(%L, %L)', '01711-004002', o_num) into r;
  perform pg_temp.expect('wrong phone finds nothing', r is null);

  perform set_config('role', me, true);
  update public.orders set status = 'confirmed' where order_number = o_num;
  perform pg_temp.act_as('anon', null);
  execute format('select public.track_order(%L, %L)', '+8801711004001', o_num) into r;
  perform pg_temp.expect('timeline grows with status changes',
    r ->> 'status' = 'confirmed' and jsonb_array_length(r -> 'history') = 2);

  -- Clean up --------------------------------------------------------------------------------------------
  perform set_config('role', me, true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  delete from public.orders where phone like '+88017110040%';
  delete from public.blocked_phones where reason = 'zz-a4';
  delete from public.coupons where code like 'ZZA4-%';
  delete from public.products where slug like 'zz-a4-%';
  delete from public.categories where slug = 'zz-a4-cat';
  delete from public.delivery_zones where name like 'zz-a4%';
  update public.site_settings set free_delivery_threshold = thr0 where id;

  -- Rewind the order-number sequence so the test leaves no gap.
  perform setval('public.order_number_seq',
    coalesce((select max(substr(order_number, 5)::bigint) from public.orders where order_number ~ '^HVX-[0-9]+$'), 10000),
    true);
end;
$$;

select 'A4 order checks passed' as result;
