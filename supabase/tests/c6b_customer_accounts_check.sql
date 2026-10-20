-- C6b checks. Run in the SQL editor after applying 20261024100000_c6b_customer_accounts.sql.
-- Creates two throwaway customers and two orders; everything is rolled back at the end.
begin;

do $$ begin
  if to_regclass('public.customer_profiles') is null or to_regprocedure('public.my_orders(integer)') is null then
    raise exception 'FAIL: apply 20261024100000_c6b_customer_accounts.sql first';
  end if;
end $$;

-- Fixtures: a confirmed customer (a), an unconfirmed sign-up using b's address,
-- one order with a's email (mixed case) and one with someone else's.
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at) values
  ('00000000-0000-4000-8000-00000000c6a1', 'authenticated', 'authenticated', 'c6b.alice@example.com', now(), now(), now()),
  ('00000000-0000-4000-8000-00000000c6b2', 'authenticated', 'authenticated', 'c6b.bob@example.com', null, now(), now());

insert into public.orders (id, order_number, customer_name, phone, email, address, district, subtotal, total) values
  ('00000000-0000-4000-8000-00000000c601', 'HVX-C6B01', 'Alice Test', '+8801711000001', 'C6B.Alice@Example.com', 'Road 1, Dhanmondi', 'Dhaka', 5000, 5000),
  ('00000000-0000-4000-8000-00000000c602', 'HVX-C6B02', 'Bob Test', '+8801711000002', 'c6b.bob@example.com', 'Road 2, Gulshan', 'Dhaka', 3000, 3000);
insert into public.order_items (order_id, name_snapshot, unit_price, qty) values
  ('00000000-0000-4000-8000-00000000c601', 'Test watch', 2500, 2);

-- Anonymous callers get nothing.
set local role anon;
do $$ begin perform 1 from public.customer_profiles; raise exception 'FAIL: anon read customer_profiles';
exception when insufficient_privilege then null; end $$;
do $$ begin perform public.my_orders(); raise exception 'FAIL: anon ran my_orders';
exception when insufficient_privilege then null; end $$;
reset role;

-- Customer a: own profile only, no admin rights, own orders via my_orders.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-00000000c6a1', 'role', 'authenticated')::text, true);

do $$ begin
  if public.is_admin() then raise exception 'FAIL: a customer counts as admin'; end if;
  if public.admin_role() is not null then raise exception 'FAIL: a customer has an admin role'; end if;
end $$;

insert into public.customer_profiles (user_id, name, phone) values ('00000000-0000-4000-8000-00000000c6a1', 'Alice Test', '+8801711000001');
update public.customer_profiles set name = 'Alice T' where user_id = '00000000-0000-4000-8000-00000000c6a1';

do $$ begin
  insert into public.customer_profiles (user_id, name) values ('00000000-0000-4000-8000-00000000c6b2', 'Not me');
  raise exception 'FAIL: a customer created someone else''s profile';
exception when insufficient_privilege then null; end $$;

do $$ begin
  update public.customer_profiles set user_id = '00000000-0000-4000-8000-00000000c6b2';
  raise exception 'FAIL: a customer changed their profile''s user_id';
exception when insufficient_privilege then null; end $$;

do $$ begin
  insert into public.customer_profiles (user_id, phone) values ('00000000-0000-4000-8000-00000000c6a1', '12345');
  raise exception 'FAIL: bad phone accepted';
exception when check_violation or unique_violation then null; end $$;

do $$ declare n int; begin
  select count(*) into n from public.orders;
  if n <> 0 then raise exception 'FAIL: a customer can read the orders table (% rows)', n; end if;
  select count(*) into n from public.admin_customers;
  if n <> 0 then raise exception 'FAIL: a customer can read admin_customers'; end if;
  select count(*) into n from public.admin_profiles;
  if n <> 0 then raise exception 'FAIL: a customer can read admin_profiles'; end if;
end $$;

do $$ begin
  insert into public.admin_profiles (user_id, name, role) values ('00000000-0000-4000-8000-00000000c6a1', 'Alice', 'owner');
  raise exception 'FAIL: a customer made themselves an admin';
exception when insufficient_privilege then null; end $$;

do $$ begin perform public.admin_users(); raise exception 'FAIL: a customer ran admin_users';
exception when others then if sqlerrm <> 'forbidden' then raise exception 'FAIL: expected forbidden, got %', sqlerrm; end if; end $$;

do $$ declare r record; n int; begin
  select count(*) into n from public.my_orders();
  if n <> 1 then raise exception 'FAIL: expected 1 order for a, got %', n; end if;
  select * into r from public.my_orders();
  if r.order_number <> 'HVX-C6B01' or r.item_count <> 2 or r.total <> 5000 then
    raise exception 'FAIL: wrong order row %', row_to_json(r);
  end if;
end $$;

-- Customer b (email not confirmed yet): no orders, and can't see a's profile.
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-4000-8000-00000000c6b2', 'role', 'authenticated')::text, true);
do $$ declare n int; begin
  select count(*) into n from public.my_orders();
  if n <> 0 then raise exception 'FAIL: unconfirmed email sees % orders', n; end if;
  select count(*) into n from public.customer_profiles;
  if n <> 0 then raise exception 'FAIL: b reads a''s profile'; end if;
end $$;
reset role;

select 'C6b customer account checks passed' as result;
rollback;
