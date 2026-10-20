-- C6b checks. Run in the SQL editor after applying 20261024100000_c6b_customer_accounts.sql.
-- Creates throwaway customers, a product, a zone and orders; everything is rolled back at the end.
begin;

do $$ begin
  if to_regclass('public.customer_profiles') is null or to_regprocedure('public.my_orders(integer)') is null
     or not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'orders' and column_name = 'user_id') then
    raise exception 'FAIL: apply 20261024100000_c6b_customer_accounts.sql first';
  end if;
end $$;

-- Acts as a role (and user) for the rest of the transaction, like PostgREST does.
create or replace function pg_temp.act_as(r text, uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', r, 'sub', uid)::text, true);
  perform set_config('role', r, true);
end;
$$;

-- Fixtures. Victim (v) placed a guest order with her email and one while signed in.
-- Attacker (a) signs up with the victim's email in different case (no confirmation,
-- so Supabase marks it confirmed).
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at) values
  ('00000000-0000-4000-8000-00000000c6a1', 'authenticated', 'authenticated', 'c6b.victim@example.com', now(), now(), now()),
  ('00000000-0000-4000-8000-00000000c6b2', 'authenticated', 'authenticated', 'C6B.Victim@Example.com', now(), now(), now());

insert into public.orders (id, order_number, customer_name, phone, email, address, district, subtotal, total, user_id) values
  ('00000000-0000-4000-8000-00000000c601', 'HVX-C6B01', 'Victim', '+8801711000001', 'c6b.victim@example.com', 'Road 1, Dhanmondi', 'Dhaka', 5000, 5000, null),
  ('00000000-0000-4000-8000-00000000c602', 'HVX-C6B02', 'Victim', '+8801711000001', 'c6b.victim@example.com', 'Road 1, Dhanmondi', 'Dhaka', 3000, 3000,
   '00000000-0000-4000-8000-00000000c6a1');
insert into public.order_items (order_id, name_snapshot, unit_price, qty) values
  ('00000000-0000-4000-8000-00000000c602', 'Test watch', 1500, 2);

insert into public.categories (id, slug, name) values ('00000000-0000-4000-8000-00000000c6c0', 'zz-c6b-cat', 'zz-c6b');
insert into public.products (id, slug, name, price, stock, status, category_id) values
  ('00000000-0000-4000-8000-00000000c6d0', 'zz-c6b-watch', 'zz-c6b Watch', 2000, 50, 'active', '00000000-0000-4000-8000-00000000c6c0');
insert into public.delivery_zones (id, name, charge) values ('00000000-0000-4000-8000-00000000c6e0', 'zz-c6b zone', 60);

-- Anonymous callers: no profiles, no my_orders; a guest order gets no user_id.
select pg_temp.act_as('anon', null);
do $$ begin perform 1 from public.customer_profiles; raise exception 'FAIL: anon read customer_profiles';
exception when insufficient_privilege then null; end $$;
do $$ begin perform public.my_orders(); raise exception 'FAIL: anon ran my_orders';
exception when insufficient_privilege then null; end $$;
do $$ declare r jsonb; begin
  r := public.place_order(
    p_items => '[{"product_id": "00000000-0000-4000-8000-00000000c6d0", "qty": 1}]',
    p_zone_id => '00000000-0000-4000-8000-00000000c6e0', p_customer_name => 'Guest C6b',
    p_phone => '+8801711000011', p_address => 'House 4, Road 7, Dhanmondi', p_district => 'Dhaka');
  perform set_config('c6b.guest_order', r ->> 'order_id', true);
end $$;
reset role;
do $$ begin
  if (select user_id from public.orders where id = current_setting('c6b.guest_order')::uuid) is not null then
    raise exception 'FAIL: a guest order got a user_id';
  end if;
end $$;

-- Attacker (same email as the victim, different account): sees none of her orders.
select pg_temp.act_as('authenticated', '00000000-0000-4000-8000-00000000c6b2');
do $$ declare n int; begin
  select count(*) into n from public.my_orders();
  if n <> 0 then raise exception 'FAIL: an account with the victim''s email sees % of her orders', n; end if;
  if public.is_admin() then raise exception 'FAIL: a customer counts as admin'; end if;
end $$;
do $$ begin
  update public.orders set user_id = '00000000-0000-4000-8000-00000000c6b2' where order_number = 'HVX-C6B02';
  raise exception 'FAIL: a customer changed an order''s user_id';
exception when insufficient_privilege then null; end $$;

-- The attacker's own signed-in order is linked to the attacker (from the token, not an argument).
do $$ declare r jsonb; n int; begin
  r := public.place_order(
    p_items => '[{"product_id": "00000000-0000-4000-8000-00000000c6d0", "qty": 2}]',
    p_zone_id => '00000000-0000-4000-8000-00000000c6e0', p_customer_name => 'Attacker C6b',
    p_phone => '+8801711000012', p_address => 'House 5, Road 8, Gulshan', p_district => 'Dhaka',
    p_email => 'c6b.victim@example.com');
  select count(*) into n from public.my_orders() m where m.order_number = r ->> 'order_number' and m.item_count = 2;
  if n <> 1 then raise exception 'FAIL: signed-in order not in my_orders'; end if;
  select count(*) into n from public.my_orders();
  if n <> 1 then raise exception 'FAIL: attacker expected 1 order, got %', n; end if;
end $$;

-- Victim: her own profile only, no admin rights, only the order placed while signed in.
select pg_temp.act_as('authenticated', '00000000-0000-4000-8000-00000000c6a1');
do $$ begin
  if public.admin_role() is not null then raise exception 'FAIL: a customer has an admin role'; end if;
end $$;

insert into public.customer_profiles (user_id, name, phone) values ('00000000-0000-4000-8000-00000000c6a1', 'Victim Test', '+8801711000001');
update public.customer_profiles set name = 'Victim T' where user_id = '00000000-0000-4000-8000-00000000c6a1';

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
  insert into public.admin_profiles (user_id, name, role) values ('00000000-0000-4000-8000-00000000c6a1', 'Victim', 'owner');
  raise exception 'FAIL: a customer made themselves an admin';
exception when insufficient_privilege then null; end $$;

do $$ begin perform public.admin_users(); raise exception 'FAIL: a customer ran admin_users';
exception when others then if sqlerrm <> 'forbidden' then raise exception 'FAIL: expected forbidden, got %', sqlerrm; end if; end $$;

do $$ declare r record; n int; begin
  select count(*) into n from public.my_orders();
  if n <> 1 then raise exception 'FAIL: expected 1 order for the victim, got %', n; end if;
  select * into r from public.my_orders();
  if r.order_number <> 'HVX-C6B02' or r.item_count <> 2 or r.total <> 3000 then
    raise exception 'FAIL: wrong order row %', row_to_json(r);
  end if;
end $$;

-- The attacker can't see the victim's profile.
select pg_temp.act_as('authenticated', '00000000-0000-4000-8000-00000000c6b2');
do $$ declare n int; begin
  select count(*) into n from public.customer_profiles;
  if n <> 0 then raise exception 'FAIL: one customer reads another''s profile'; end if;
end $$;
reset role;

select 'C6b customer account checks passed' as result;
rollback;
