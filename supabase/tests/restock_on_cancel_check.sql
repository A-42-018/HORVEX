-- Restock-on-cancel checks. Run in the SQL editor after applying
-- 20261020140000_restock_on_cancel.sql and 20261020150000_admin_list_offsets.sql.
-- Uses throwaway "zz-rs" fixtures inserted directly (no place_order, so no rate
-- limits or order numbers used). Everything is rolled back at the end.
-- Expected result: one row, "restock checks passed".
begin;

create or replace function pg_temp.expect(label text, ok boolean) returns void
language plpgsql as $$
begin
  if ok is not true then
    raise exception 'Restock check failed: %', label;
  end if;
end;
$$;

do $$
declare
  p_plain uuid;
  p_var   uuid;
  v_steel uuid;
  v_gone  uuid;
  o_id    uuid;
begin
  insert into public.products (slug, name, price, stock, status) values ('zz-rs-plain', 'zz-rs plain', 1000, 5, 'active')
    returning id into p_plain;
  insert into public.products (slug, name, price, stock, status) values ('zz-rs-var', 'zz-rs var', 1000, 0, 'active')
    returning id into p_var;
  insert into public.product_variants (product_id, name, stock) values (p_var, 'Steel', 4) returning id into v_steel;
  insert into public.product_variants (product_id, name, stock) values (p_var, 'Gold', 4) returning id into v_gone;
  insert into public.coupons (code, type, value, used) values ('ZZRS-ONE', 'fixed', 100, 1);

  -- As if place_order had taken 2 plain, 3 steel, 1 gold and used the coupon.
  insert into public.orders (order_number, customer_name, phone, address, district, subtotal, total, coupon_code)
    values ('HVX-ZZRS1', 'zz-rs buyer', '+8801711004099', 'House 4, Road 7, Dhanmondi', 'Dhaka', 6000, 5900, 'ZZRS-ONE')
    returning id into o_id;
  insert into public.order_items (order_id, product_id, variant_id, name_snapshot, variant_snapshot, unit_price, qty) values
    (o_id, p_plain, null, 'zz-rs plain', null, 1000, 2),
    (o_id, p_var, v_steel, 'zz-rs var', 'Steel', 1000, 3),
    (o_id, p_var, v_gone, 'zz-rs var', 'Gold', 1000, 1);

  -- The Gold variant is deleted after the order: its line must be skipped, not
  -- credited to the product.
  delete from public.product_variants where id = v_gone;

  update public.orders set status = 'confirmed' where id = o_id;
  perform pg_temp.expect('non-cancel change leaves stock alone',
    (select stock from public.products where id = p_plain) = 5);

  update public.orders set status = 'cancelled' where id = o_id;
  perform pg_temp.expect('plain product restocked', (select stock from public.products where id = p_plain) = 7);
  perform pg_temp.expect('variant restocked', (select stock from public.product_variants where id = v_steel) = 7);
  perform pg_temp.expect('deleted variant not credited to product', (select stock from public.products where id = p_var) = 0);
  perform pg_temp.expect('coupon use given back', (select used from public.coupons where code = 'ZZRS-ONE') = 0);

  -- cancelled → returned must not restock twice (or push used below 0).
  update public.orders set status = 'returned' where id = o_id;
  perform pg_temp.expect('no double restock', (select stock from public.products where id = p_plain) = 7);
  perform pg_temp.expect('used never below 0', (select used from public.coupons where code = 'ZZRS-ONE') = 0);

  -- A return from delivered restocks too.
  insert into public.orders (order_number, customer_name, phone, address, district, subtotal, total, status)
    values ('HVX-ZZRS2', 'zz-rs buyer', '+8801711004099', 'House 4, Road 7, Dhanmondi', 'Dhaka', 1000, 1000, 'delivered')
    returning id into o_id;
  insert into public.order_items (order_id, product_id, name_snapshot, unit_price, qty) values (o_id, p_plain, 'zz-rs plain', 1000, 1);
  update public.orders set status = 'returned' where id = o_id;
  perform pg_temp.expect('return restocks', (select stock from public.products where id = p_plain) = 8);
end $$;

-- The trigger function is not callable through the API.
select pg_temp.expect('API roles cannot execute restock_cancelled_order',
  not has_function_privilege('anon', 'public.restock_cancelled_order()', 'execute')
  and not has_function_privilege('authenticated', 'public.restock_cancelled_order()', 'execute'));

-- admin_activity_log now takes an offset, and anon still can't run it.
set local role anon;
do $$ begin perform public.admin_activity_log(null, 50, 50); raise exception 'FAIL: anon ran admin_activity_log';
exception when insufficient_privilege then null; end $$;
reset role;

select 'restock checks passed' as result;
rollback;
