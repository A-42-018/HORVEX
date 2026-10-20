-- WRISTORY · Phase C5 — security and abuse checks. Paste into the Supabase SQL Editor and Run
-- after applying 20261021100000_c5_security.sql.
-- Throwaway fixtures ("zz-c5" slugs/names, phones +88017110050xx, IPs from the
-- 198.51.100.0/24 documentation range). Calls the API functions as anon / staff the
-- way the browser does. Everything is rolled back at the end, and the order-number
-- sequence is rewound.
-- Expected result: one row, "C5 security checks passed".
begin;

create or replace function pg_temp.expect(label text, ok boolean) returns void
language plpgsql as $$
begin
  if ok is not true then
    raise exception 'C5 security check failed: %', label;
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

-- The jsonb a statement returns.
create or replace function pg_temp.val(q text) returns jsonb
language plpgsql as $$
declare r jsonb;
begin
  execute q into r;
  return r;
end;
$$;

create or replace function pg_temp.act_as(r text, uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', r, 'sub', uid)::text, true);
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  perform set_config('role', r, true);
end;
$$;

create or replace function pg_temp.from_ip(ip text) returns void
language sql as $$
  select set_config('request.headers', case when ip is null then '' else json_build_object('cf-connecting-ip', ip)::text end, true);
$$;

create or replace function pg_temp.c5_order_sql(items jsonb, zone uuid, phone text, coupon text default null,
  name text default 'zz-c5 buyer', address text default 'House 4, Road 7, Dhanmondi', note text default null)
returns text
language sql as $$
  select format(
    'select public.place_order(p_items => %L, p_zone_id => %L, p_customer_name => %L, p_phone => %L,
       p_address => %L, p_district => %L, p_note => %L, p_coupon_code => %L)',
    items, zone, name, phone, address, 'Dhaka', note, coupon)
$$;

create or replace function pg_temp.c5_quote_sql(items jsonb, zone uuid, coupon text default null) returns text
language sql as $$
  select format('select public.quote_order(%L, %L, %L)', items, zone, coupon)
$$;

-- Fail early with a clear message if the migration hasn't been applied.
select pg_temp.expect('apply 20261021100000_c5_security.sql first',
  exists (select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'orders' and column_name = 'stock_restored')
  and exists (select 1 from pg_proc where proname = 'place_order_checked' and pronamespace = 'public'::regnamespace));

do $$
declare
  me      text := current_user;
  u_staff uuid := gen_random_uuid();
  u_user  uuid := gen_random_uuid();
  c_id    uuid;
  p_watch uuid;  -- ৳5,000, stock 100
  z_dhaka uuid;  -- ৳70
  o_id    uuid;
  o_num   text;
  one     jsonb;
  r       jsonb;
  i       int;
begin
  -- Fixtures (as the SQL Editor's own role) ------------------------------------
  update public.site_settings set maintenance_mode = false, free_delivery_threshold = null where id;
  insert into auth.users (id, aud, role, email) values
    (u_staff, 'authenticated', 'authenticated', 'zz-c5-staff@example.test'),
    (u_user,  'authenticated', 'authenticated', 'zz-c5-user@example.test');
  insert into public.admin_profiles (user_id, name, role) values (u_staff, 'zz-c5 staff', 'staff');

  insert into public.categories (slug, name) values ('zz-c5-cat', 'zz-c5') returning id into c_id;
  insert into public.products (slug, name, price, stock, status, category_id)
    values ('zz-c5-watch', 'zz-c5 Watch', 5000, 100, 'active', c_id) returning id into p_watch;
  insert into public.delivery_zones (name, charge) values ('zz-c5 Dhaka', 70) returning id into z_dhaka;
  insert into public.coupons (code, type, value) values ('ZZC5-OK', 'fixed', 500);
  insert into public.coupons (code, type, value, max_uses) values ('ZZC5-ONCE', 'fixed', 100, 1);
  one := jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 1));

  -- Privileges -------------------------------------------------------------------
  perform pg_temp.expect('API roles cannot update order totals or the restock flag',
    not has_column_privilege('authenticated', 'public.orders', 'total', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.orders', 'coupon_code', 'UPDATE')
    and not has_column_privilege('authenticated', 'public.orders', 'stock_restored', 'UPDATE')
    and has_column_privilege('authenticated', 'public.orders', 'status', 'UPDATE')
    and has_column_privilege('authenticated', 'public.orders', 'admin_note', 'UPDATE'));
  perform pg_temp.expect('internal functions are not callable from the API',
    not has_function_privilege('anon', 'public.place_order_checked(jsonb, uuid, text, text, text, text, text, text, text, text)', 'execute')
    and not has_function_privilege('authenticated', 'public.place_order_checked(jsonb, uuid, text, text, text, text, text, text, text, text)', 'execute')
    and not has_function_privilege('anon', 'public.note_attempt(text, text)', 'execute')
    and not has_function_privilege('anon', 'public.attempts_exceeded(text, text, integer, interval)', 'execute')
    and not has_function_privilege('anon', 'public.coupon_locked(text)', 'execute')
    and not has_function_privilege('authenticated', 'public.limit_inbound_form()', 'execute'));
  perform pg_temp.expect('public RPCs still callable',
    has_function_privilege('anon', 'public.place_order(jsonb, uuid, text, text, text, text, text, text, text, text)', 'execute')
    and has_function_privilege('anon', 'public.quote_order(jsonb, uuid, text)', 'execute')
    and has_function_privilege('anon', 'public.track_order(text, text)', 'execute'));

  perform pg_temp.act_as('anon', null);
  perform pg_temp.expect('anon cannot read request_attempts', pg_temp.err('select 1 from public.request_attempts') = 'denied');
  perform pg_temp.expect('anon cannot call place_order_checked', pg_temp.err(format(
    'select public.place_order_checked(%L, %L, ''zz-c5 x'', ''01711005001'', ''House 4, Road 7'')', one, z_dhaka)) = 'denied');

  -- place_order abuse (anon, no IP) ---------------------------------------------------------------
  perform pg_temp.expect('fractional qty refused', pg_temp.err(pg_temp.c5_order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 1.5)), z_dhaka, '01711005002')) = 'invalid_item');
  perform pg_temp.expect('huge qty refused', pg_temp.err(pg_temp.c5_order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 1e12)), z_dhaka, '01711005002')) = 'invalid_item');
  perform pg_temp.expect('text qty refused', pg_temp.err(pg_temp.c5_order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 'lots')), z_dhaka, '01711005002')) = 'invalid_item');
  perform pg_temp.expect('missing product id refused', pg_temp.err(pg_temp.c5_order_sql(
    jsonb_build_array(jsonb_build_object('qty', 1)), z_dhaka, '01711005002')) = 'invalid_item');
  perform pg_temp.expect('21 lines refused', pg_temp.err(pg_temp.c5_order_sql(
    (select jsonb_agg(jsonb_build_object('product_id', p_watch, 'qty', 1)) from generate_series(1, 21)),
    z_dhaka, '01711005002')) = 'too_many_items');
  perform pg_temp.expect('split lines over 10 refused', pg_temp.err(pg_temp.c5_order_sql(
    jsonb_build_array(jsonb_build_object('product_id', p_watch, 'qty', 6), jsonb_build_object('product_id', p_watch, 'qty', 5)),
    z_dhaka, '01711005002')) = 'invalid_item');
  perform pg_temp.expect('items as an object refused', pg_temp.err(pg_temp.c5_order_sql(
    jsonb_build_object('product_id', p_watch, 'qty', 1), z_dhaka, '01711005002')) = 'empty_cart');
  perform pg_temp.expect('null items refused', pg_temp.err(pg_temp.c5_order_sql(null, z_dhaka, '01711005002')) = 'empty_cart');
  perform pg_temp.expect('missing zone refused', pg_temp.err(pg_temp.c5_order_sql(one, null, '01711005002')) = 'invalid_zone');
  perform pg_temp.expect('overlong address refused', pg_temp.err(pg_temp.c5_order_sql(
    one, z_dhaka, '01711005002', address => repeat('a', 301))) = 'invalid_address');
  perform pg_temp.expect('overlong note refused', pg_temp.err(pg_temp.c5_order_sql(
    one, z_dhaka, '01711005002', note => repeat('a', 501))) = 'invalid_note');
  perform pg_temp.expect('Bangla-digit phone refused', pg_temp.err(pg_temp.c5_order_sql(
    one, z_dhaka, '০১৭১১০০৫০০২')) = 'invalid_phone');
  perform pg_temp.expect('nothing above changed stock',
    pg_temp.val(format('select to_jsonb(stock) from public.products where id = %L', p_watch)) = '100');

  -- A negative line can't buy something for free: lines are merged first, then checked.
  r := pg_temp.val(pg_temp.c5_order_sql(jsonb_build_array(
    jsonb_build_object('product_id', p_watch, 'qty', -5, 'unit_price', 0),
    jsonb_build_object('product_id', p_watch, 'qty', 6, 'price', 1)), z_dhaka, '01711005003'));
  perform pg_temp.expect('negative + positive lines charge the merged qty at the DB price',
    (r ->> 'subtotal')::int = 5000 and (r ->> 'total')::int = 5070);

  -- Injection-looking input is stored as plain text.
  r := pg_temp.val(pg_temp.c5_order_sql(one, z_dhaka, '01711005004',
    name => 'zz-c5 Robert''); drop table public.orders;--', note => '<script>alert(1)</script>'));
  perform set_config('role', me, true);
  perform pg_temp.expect('injection-looking text stored verbatim', exists (
    select 1 from public.orders where order_number = r ->> 'order_number'
      and customer_name = 'zz-c5 Robert''); drop table public.orders;--' and customer_note = '<script>alert(1)</script>'));
  perform pg_temp.expect('stock taken for the two orders', (select stock from public.products where id = p_watch) = 98);

  -- A one-use coupon can't be used twice.
  perform pg_temp.act_as('anon', null);
  r := pg_temp.val(pg_temp.c5_order_sql(one, z_dhaka, '01711005005', coupon => 'zzc5-once'));
  perform pg_temp.expect('one-use coupon applies once', (r ->> 'discount')::int = 100);
  perform pg_temp.expect('one-use coupon refused the second time', pg_temp.err(pg_temp.c5_order_sql(
    one, z_dhaka, '01711005006', coupon => ' ZZC5-ONCE ')) = 'invalid_coupon');

  -- Maintenance mode stops orders.
  perform set_config('role', me, true);
  update public.site_settings set maintenance_mode = true where id;
  perform pg_temp.act_as('anon', null);
  perform pg_temp.expect('maintenance refuses orders', pg_temp.err(pg_temp.c5_order_sql(one, z_dhaka, '01711005007')) = 'maintenance');
  perform set_config('role', me, true);
  update public.site_settings set maintenance_mode = false where id;

  -- Staff: status yes, money no; restock happens once --------------------------------------------
  select id, order_number into o_id, o_num from public.orders where phone = '+8801711005005';
  perform pg_temp.act_as('authenticated', u_user);
  perform pg_temp.expect('signed-in non-admin changes no order', pg_temp.val(format(
    'with u as (update public.orders set status = ''cancelled'' where id = %L returning 1) select to_jsonb(count(*)) from u', o_id)) = '0');
  perform pg_temp.act_as('authenticated', u_staff);
  perform pg_temp.expect('staff cannot change the total', pg_temp.err(format(
    'update public.orders set total = 1 where id = %L', o_id)) = 'denied');
  perform pg_temp.expect('staff cannot change the coupon', pg_temp.err(format(
    'update public.orders set coupon_code = null where id = %L', o_id)) = 'denied');
  perform pg_temp.expect('staff cannot reset the restock flag', pg_temp.err(format(
    'update public.orders set stock_restored = false where id = %L', o_id)) = 'denied');
  perform pg_temp.expect('staff can set courier and note', pg_temp.err(format(
    'update public.orders set courier = ''zz-c5'', tracking_id = ''T1'', admin_note = ''zz'' where id = %L', o_id)) = 'ok');

  perform set_config('role', me, true);
  update public.coupons set used = 3 where code = 'ZZC5-ONCE';
  perform pg_temp.act_as('authenticated', u_staff);
  perform pg_temp.err(format('update public.orders set status = ''cancelled'' where id = %L', o_id));
  perform pg_temp.err(format('update public.orders set status = ''pending'' where id = %L', o_id));
  perform pg_temp.err(format('update public.orders set status = ''cancelled'' where id = %L', o_id));
  perform set_config('role', me, true);
  perform pg_temp.expect('cancel → pending → cancel restocks once', (select stock from public.products where id = p_watch) = 98);
  perform pg_temp.expect('coupon use given back once', (select used from public.coupons where code = 'ZZC5-ONCE') = 2);
  perform pg_temp.expect('status history still logged',
    (select count(*) from public.order_status_history where order_id = o_id) = 4);

  -- Coupon guessing (one IP) ---------------------------------------------------------------------
  perform pg_temp.act_as('anon', null);
  perform pg_temp.from_ip('198.51.100.7');
  for i in 1..10 loop
    r := pg_temp.val(pg_temp.c5_quote_sql(one, z_dhaka, format('ZZC5-GUESS%s', i)));
    perform pg_temp.expect(format('miss %s comes back as a soft invalid_coupon', i), r ->> 'error' = 'invalid_coupon');
  end loop;
  perform pg_temp.expect('after 10 misses a valid code is refused too',
    pg_temp.err(pg_temp.c5_quote_sql(one, z_dhaka, 'ZZC5-OK')) = 'invalid_coupon');
  perform pg_temp.expect('and place_order refuses it as well',
    pg_temp.err(pg_temp.c5_order_sql(one, z_dhaka, '01711005008', coupon => 'ZZC5-OK')) = 'invalid_coupon');
  perform pg_temp.expect('quotes without a coupon still work',
    (pg_temp.val(pg_temp.c5_quote_sql(one, z_dhaka)) ->> 'total')::int = 5070);
  perform pg_temp.from_ip('198.51.100.8');
  perform pg_temp.expect('another IP is unaffected',
    (pg_temp.val(pg_temp.c5_quote_sql(one, z_dhaka, 'ZZC5-OK')) ->> 'discount')::int = 500);
  perform pg_temp.from_ip('198.51.100.9');
  r := pg_temp.val(pg_temp.c5_order_sql(one, z_dhaka, '01711005009', coupon => 'ZZC5-NOPE'));
  perform pg_temp.expect('place_order with an unknown code: soft error', r ->> 'error' = 'invalid_coupon');
  perform set_config('role', me, true);
  perform pg_temp.expect('a soft-refused order leaves no order and no stock change',
    not exists (select 1 from public.orders where phone = '+8801711005009')
    and (select stock from public.products where id = p_watch) = 98);

  -- track_order guessing -------------------------------------------------------------------------
  perform pg_temp.act_as('anon', null);
  perform pg_temp.from_ip(null);
  for i in 1..20 loop
    perform pg_temp.expect('a miss returns null',
      pg_temp.val(format('select public.track_order(''01711005010'', ''HVX-%s'')', 90000 + i)) is null);
  end loop;
  perform pg_temp.expect('21st miss for one phone in a day is refused', pg_temp.err(
    'select public.track_order(''01711005010'', ''HVX-99999'')') = 'rate_limited');

  for i in 1..25 loop
    perform pg_temp.val(format('select public.track_order(''01711005005'', %L)', o_num));
  end loop;
  perform pg_temp.expect('found lookups never count (26th still works)',
    pg_temp.val(format('select public.track_order(''01711005005'', %L)', o_num)) ->> 'order_number' = o_num);

  perform pg_temp.from_ip('198.51.100.20');
  for i in 1..30 loop
    perform pg_temp.val(format('select public.track_order(%L, ''HVX-99999'')', format('0171100%s', 6000 + i)));
  end loop;
  perform pg_temp.expect('31st miss from one IP in an hour is refused', pg_temp.err(
    'select public.track_order(''01711005099'', ''HVX-99999'')') = 'rate_limited');
  perform pg_temp.from_ip(null);

  -- Contact form and newsletter flooding ------------------------------------------------------------
  perform pg_temp.from_ip('198.51.100.30');
  for i in 1..5 loop
    perform pg_temp.expect('contact message accepted', pg_temp.err(
      'insert into public.contact_messages (name, message) values (''zz-c5'', ''hello'')') = 'ok');
    perform pg_temp.expect('newsletter signup accepted', pg_temp.err(format(
      'insert into public.subscribers (email, source) values (''zz-c5-%s@example.test'', ''zz-c5'')', i)) = 'ok');
  end loop;
  perform pg_temp.expect('6th contact message in 10 minutes refused', pg_temp.err(
    'insert into public.contact_messages (name, message) values (''zz-c5'', ''hello'')') = 'rate_limited');
  perform pg_temp.expect('6th signup in 10 minutes refused', pg_temp.err(
    'insert into public.subscribers (email, source) values (''zz-c5-6@example.test'', ''zz-c5'')') = 'rate_limited');
  perform pg_temp.from_ip(null);

  perform set_config('role', me, true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  -- setval isn't undone by the rollback, so rewind the order numbers used here.
  perform setval('public.order_number_seq',
    coalesce((select max(substr(order_number, 5)::bigint) from public.orders
              where order_number ~ '^HVX-[0-9]+$' and phone not like '+88017110050%'), 10000),
    true);
end;
$$;

select 'C5 security checks passed' as result;
rollback;
