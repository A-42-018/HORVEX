-- WRISTORY · Phase A3 — RLS check. Paste into the Supabase SQL Editor and Run.
-- Creates throwaway fixtures (slugs/names start with "zz-a3"), impersonates
-- anon / a signed-in non-admin / staff / manager / owner, and checks what each can
-- see and change. Fixtures are deleted at the end; if any check fails, the whole
-- run is rolled back and the error names the failing check.
-- Expected result: one row, "A3 RLS checks passed".

create or replace function pg_temp.n(q text) returns bigint
language plpgsql as $$
declare c bigint;
begin
  execute format('select count(*) from (%s) t', q) into c;
  return c;
end;
$$;

-- Rows changed by a write; null if the write was refused outright.
create or replace function pg_temp.affected(q text) returns bigint
language plpgsql as $$
declare c bigint;
begin
  execute q;
  get diagnostics c = row_count;
  return c;
exception when insufficient_privilege then
  return null;
end;
$$;

create or replace function pg_temp.denied(q text) returns boolean
language plpgsql as $$
begin
  execute q;
  return false;
exception when insufficient_privilege then
  return true;
end;
$$;

create or replace function pg_temp.expect(label text, ok boolean) returns void
language plpgsql as $$
begin
  if ok is not true then
    raise exception 'A3 RLS check failed: %', label;
  end if;
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

do $$
declare
  me        text := current_user;
  u_owner   uuid := gen_random_uuid();
  u_manager uuid := gen_random_uuid();
  u_staff   uuid := gen_random_uuid();
  u_user    uuid := gen_random_uuid();
  c_vis     uuid; c_hid uuid;
  p_active  uuid; p_draft uuid; p_arch uuid;
  col_live  uuid; col_old uuid;
  z_on      uuid; z_off uuid;
  o1        uuid;
  fx_prod   text;
  fx_order  text;
begin
  -- Structural guarantees ------------------------------------------------------
  perform pg_temp.expect('products has no cost_price column', not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'cost_price'));
  perform pg_temp.expect('RLS enabled on every public table', not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity));

  -- Fixtures (as the SQL Editor's own role) ------------------------------------
  insert into auth.users (id, aud, role, email) values
    (u_owner,   'authenticated', 'authenticated', 'zz-a3-owner@example.test'),
    (u_manager, 'authenticated', 'authenticated', 'zz-a3-manager@example.test'),
    (u_staff,   'authenticated', 'authenticated', 'zz-a3-staff@example.test'),
    (u_user,    'authenticated', 'authenticated', 'zz-a3-user@example.test');
  insert into public.admin_profiles (user_id, name, role) values
    (u_owner, 'zz-a3 owner', 'owner'),
    (u_manager, 'zz-a3 manager', 'manager'),
    (u_staff, 'zz-a3 staff', 'staff');

  insert into public.categories (slug, name, is_visible) values ('zz-a3-cat-visible', 'v', true) returning id into c_vis;
  insert into public.categories (slug, name, is_visible) values ('zz-a3-cat-hidden', 'h', false) returning id into c_hid;

  insert into public.products (slug, name, price, stock, status, category_id)
    values ('zz-a3-active', 'Active', 10000, 5, 'active', c_vis) returning id into p_active;
  insert into public.products (slug, name, price, stock, status, category_id)
    values ('zz-a3-draft', 'Draft', 10000, 5, 'draft', c_vis) returning id into p_draft;
  insert into public.products (slug, name, price, stock, status, category_id)
    values ('zz-a3-archived', 'Archived', 10000, 5, 'archived', c_vis) returning id into p_arch;
  insert into public.product_costs (product_id, cost_price) values (p_active, 4000), (p_draft, 4000);
  insert into public.product_images (product_id, url) values (p_active, 'a.jpg'), (p_draft, 'd.jpg');
  insert into public.product_variants (product_id, name, stock) values (p_active, 'A', 1), (p_draft, 'D', 1);

  insert into public.collections (slug, title, is_visible) values ('zz-a3-col-live', 'Live', true) returning id into col_live;
  insert into public.collections (slug, title, is_visible, active_from, active_to)
    values ('zz-a3-col-old', 'Old', true, now() - interval '30 days', now() - interval '1 day') returning id into col_old;
  insert into public.collection_products (collection_id, product_id) values
    (col_live, p_active), (col_live, p_draft), (col_old, p_active);

  insert into public.reviews (product_id, name, rating, status) values
    (p_active, 'zz-a3 approved', 5, 'approved'), (p_active, 'zz-a3 pending', 4, 'pending');

  insert into public.delivery_zones (name, charge, is_active) values ('zz-a3 zone on', 60, true) returning id into z_on;
  insert into public.delivery_zones (name, charge, is_active) values ('zz-a3 zone off', 120, false) returning id into z_off;
  insert into public.coupons (code, type, value) values ('ZZ-A3-TEST', 'percent', 10);

  insert into public.hero_slides (title, is_active) values ('zz-a3 live', true), ('zz-a3 off', false);
  insert into public.hero_slides (title, is_active, active_from) values ('zz-a3 future', true, now() + interval '7 days');
  insert into public.banners (placement, title, is_active) values ('zz-a3', 'on', true), ('zz-a3', 'off', false);
  insert into public.home_sections (key, is_visible) values ('zz_a3_on', true), ('zz_a3_off', false);
  insert into public.pages (slug, title, is_published) values ('zz-a3-pub', 'p', true), ('zz-a3-unpub', 'u', false);
  insert into public.faqs (question, answer, is_visible) values ('zz-a3 on', 'a', true), ('zz-a3 off', 'a', false);
  insert into public.testimonials (name, text, is_visible) values ('zz-a3 on', 't', true), ('zz-a3 off', 't', false);

  insert into public.orders (order_number, customer_name, phone, address, district, zone_id,
                             delivery_charge, subtotal, total)
    values ('HVX-ZZA3T', 'zz-a3 buyer', '+8801711000000', 'House 1, Road 1', 'Dhaka', z_on, 60, 10000, 10060)
    returning id into o1;
  insert into public.order_items (order_id, product_id, name_snapshot, unit_price, qty)
    values (o1, p_active, 'Active', 10000, 1);
  insert into public.blocked_phones (phone, reason) values ('+8801799000000', 'zz-a3');

  fx_prod  := 'select 1 from public.products where slug like ''zz-a3-%''';
  fx_order := 'select 1 from public.orders where order_number = ''HVX-ZZA3T''';

  perform pg_temp.expect('order insert logged its first status', pg_temp.n(
    format('select 1 from public.order_status_history where order_id = %L and to_status = ''pending''', o1)) = 1);

  -- anon -----------------------------------------------------------------------
  perform pg_temp.act_as('anon', null);
  perform pg_temp.expect('anon sees only active products', pg_temp.n(fx_prod) = 1);
  perform pg_temp.expect('anon sees only visible categories',
    pg_temp.n('select 1 from public.categories where slug like ''zz-a3-%''') = 1);
  perform pg_temp.expect('anon sees images of active products only',
    pg_temp.n(format('select 1 from public.product_images where product_id in (%L, %L)', p_active, p_draft)) = 1);
  perform pg_temp.expect('anon sees variants of active products only',
    pg_temp.n(format('select 1 from public.product_variants where product_id in (%L, %L)', p_active, p_draft)) = 1);
  perform pg_temp.expect('anon sees only live collections',
    pg_temp.n('select 1 from public.collections where slug like ''zz-a3-%''') = 1);
  perform pg_temp.expect('anon sees live collection links to active products only',
    pg_temp.n(format('select 1 from public.collection_products where collection_id in (%L, %L)', col_live, col_old)) = 1);
  perform pg_temp.expect('anon sees only approved reviews',
    pg_temp.n('select 1 from public.reviews where name like ''zz-a3%''') = 1);
  perform pg_temp.expect('anon sees only active zones',
    pg_temp.n('select 1 from public.delivery_zones where name like ''zz-a3%''') = 1);
  perform pg_temp.expect('anon sees only live hero slides',
    pg_temp.n('select 1 from public.hero_slides where title like ''zz-a3%''') = 1);
  perform pg_temp.expect('anon sees only active banners',
    pg_temp.n('select 1 from public.banners where placement = ''zz-a3''') = 1);
  perform pg_temp.expect('anon sees only visible home sections',
    pg_temp.n('select 1 from public.home_sections where key like ''zz_a3%''') = 1);
  perform pg_temp.expect('anon sees only published pages',
    pg_temp.n('select 1 from public.pages where slug like ''zz-a3-%''') = 1);
  perform pg_temp.expect('anon sees only visible faqs',
    pg_temp.n('select 1 from public.faqs where question like ''zz-a3%''') = 1);
  perform pg_temp.expect('anon sees only visible testimonials',
    pg_temp.n('select 1 from public.testimonials where name like ''zz-a3%''') = 1);
  perform pg_temp.expect('anon reads site settings', pg_temp.n('select 1 from public.site_settings') = 1);

  perform pg_temp.expect('anon denied: orders', pg_temp.denied('select 1 from public.orders'));
  perform pg_temp.expect('anon denied: order_items', pg_temp.denied('select 1 from public.order_items'));
  perform pg_temp.expect('anon denied: order_status_history', pg_temp.denied('select 1 from public.order_status_history'));
  perform pg_temp.expect('anon denied: customers', pg_temp.denied('select 1 from public.admin_customers'));
  perform pg_temp.expect('anon denied: product_costs', pg_temp.denied('select 1 from public.product_costs'));
  perform pg_temp.expect('anon denied: coupons', pg_temp.denied('select 1 from public.coupons'));
  perform pg_temp.expect('anon denied: blocked_phones', pg_temp.denied('select 1 from public.blocked_phones'));
  perform pg_temp.expect('anon denied: admin_profiles', pg_temp.denied('select 1 from public.admin_profiles'));
  perform pg_temp.expect('anon denied: activity_log', pg_temp.denied('select 1 from public.activity_log'));
  perform pg_temp.expect('anon denied: read subscribers', pg_temp.denied('select 1 from public.subscribers'));
  perform pg_temp.expect('anon denied: read contact_messages', pg_temp.denied('select 1 from public.contact_messages'));

  perform pg_temp.expect('anon denied: insert order', pg_temp.denied(
    'insert into public.orders (order_number, customer_name, phone, address, district, subtotal, total)
     values (''HVX-ZZA3X'', ''zz-a3 x'', ''+8801711000001'', ''House 2, Road 2'', ''Dhaka'', 1, 1)'));
  perform pg_temp.expect('anon denied: insert product', pg_temp.denied(
    'insert into public.products (slug, name, price) values (''zz-a3-hack'', ''x'', 1)'));
  perform pg_temp.expect('anon denied: update product', pg_temp.denied(
    'update public.products set price = 1 where slug = ''zz-a3-active'''));
  perform pg_temp.expect('anon can subscribe', pg_temp.affected(
    'insert into public.subscribers (email, source) values (''zz-a3@example.test'', ''zz-a3'')') = 1);
  perform pg_temp.expect('anon can send a contact message', pg_temp.affected(
    'insert into public.contact_messages (name, message) values (''zz-a3 anon'', ''hi'')') = 1);
  perform pg_temp.expect('anon cannot pre-set a contact message status', pg_temp.denied(
    'insert into public.contact_messages (name, message, status) values (''zz-a3 anon'', ''hi'', ''read'')'));
  perform pg_temp.expect('anon: is_admin() is false', not public.is_admin());

  -- signed in, not an admin ------------------------------------------------------
  perform pg_temp.act_as('authenticated', u_user);
  perform pg_temp.expect('user: is_admin() is false', not public.is_admin());
  perform pg_temp.expect('user sees only active products', pg_temp.n(fx_prod) = 1);
  perform pg_temp.expect('user sees no orders', pg_temp.n('select 1 from public.orders') = 0);
  perform pg_temp.expect('user sees no order items', pg_temp.n('select 1 from public.order_items') = 0);
  perform pg_temp.expect('user sees no customers', pg_temp.n('select 1 from public.admin_customers') = 0);
  perform pg_temp.expect('user sees no costs', pg_temp.n('select 1 from public.product_costs') = 0);
  perform pg_temp.expect('user sees no coupons', pg_temp.n('select 1 from public.coupons') = 0);
  perform pg_temp.expect('user sees no admin profiles', pg_temp.n('select 1 from public.admin_profiles') = 0);
  perform pg_temp.expect('user sees no subscribers', pg_temp.n('select 1 from public.subscribers') = 0);
  perform pg_temp.expect('user cannot insert an order', pg_temp.denied(
    'insert into public.orders (order_number, customer_name, phone, address, district, subtotal, total)
     values (''HVX-ZZA3Y'', ''zz-a3 y'', ''+8801711000002'', ''House 3, Road 3'', ''Dhaka'', 1, 1)'));
  perform pg_temp.expect('user cannot change prices', coalesce(pg_temp.affected(
    'update public.products set price = 1 where slug = ''zz-a3-active'''), 0) = 0);
  perform pg_temp.expect('user cannot make themselves an admin', pg_temp.denied(format(
    'insert into public.admin_profiles (user_id, name, role) values (%L, ''zz-a3 hack'', ''owner'')', u_user)));

  -- staff (orders only) -----------------------------------------------------------
  perform pg_temp.act_as('authenticated', u_staff);
  perform pg_temp.expect('staff: is_admin() is true', public.is_admin());
  perform pg_temp.expect('staff: admin_role() is staff', public.admin_role() = 'staff');
  perform pg_temp.expect('staff reads orders', pg_temp.n(fx_order) = 1);
  perform pg_temp.expect('staff reads order items',
    pg_temp.n(format('select 1 from public.order_items where order_id = %L', o1)) = 1);
  perform pg_temp.expect('staff reads customers',
    pg_temp.n('select 1 from public.admin_customers where phone = ''+8801711000000''') = 1);
  perform pg_temp.expect('staff reads drafts too', pg_temp.n(fx_prod) = 3);
  perform pg_temp.expect('staff sees no costs', pg_temp.n('select 1 from public.product_costs') = 0);
  perform pg_temp.expect('staff sees no coupons', pg_temp.n('select 1 from public.coupons') = 0);
  perform pg_temp.expect('staff can confirm an order', pg_temp.affected(format(
    'update public.orders set status = ''confirmed'' where id = %L', o1)) = 1);
  perform pg_temp.expect('status change logged with the staff user', pg_temp.n(format(
    'select 1 from public.order_status_history where order_id = %L and from_status = ''pending''
       and to_status = ''confirmed'' and changed_by = %L', o1, u_staff)) = 1);
  perform pg_temp.expect('staff cannot edit products', coalesce(pg_temp.affected(
    'update public.products set price = 1 where slug = ''zz-a3-active'''), 0) = 0);
  perform pg_temp.expect('staff cannot promote themselves', coalesce(pg_temp.affected(format(
    'update public.admin_profiles set role = ''owner'' where user_id = %L', u_staff)), 0) = 0);
  perform pg_temp.expect('staff cannot change settings', coalesce(pg_temp.affected(
    'update public.site_settings set brand_name = brand_name'), 0) = 0);
  perform pg_temp.expect('staff can block a phone', pg_temp.affected(
    'insert into public.blocked_phones (phone, reason) values (''+8801799000001'', ''zz-a3'')') = 1);
  perform pg_temp.expect('staff can write the activity log as self', pg_temp.affected(
    'insert into public.activity_log (action, entity) values (''test'', ''zz-a3'')') = 1);
  perform pg_temp.expect('staff cannot write the log as someone else', pg_temp.denied(format(
    'insert into public.activity_log (actor, action, entity) values (%L, ''test'', ''zz-a3'')', u_owner)));

  -- manager (all except users/settings) ----------------------------------------
  perform pg_temp.act_as('authenticated', u_manager);
  perform pg_temp.expect('manager reads costs',
    pg_temp.n(format('select 1 from public.product_costs where product_id in (%L, %L)', p_active, p_draft)) = 2);
  perform pg_temp.expect('manager reads coupons',
    pg_temp.n('select 1 from public.coupons where code = ''ZZ-A3-TEST''') = 1);
  perform pg_temp.expect('manager can edit products', pg_temp.affected(
    'update public.products set price = 9500 where slug = ''zz-a3-active''') = 1);
  perform pg_temp.expect('manager reads subscribers',
    pg_temp.n('select 1 from public.subscribers where source = ''zz-a3''') = 1);
  perform pg_temp.expect('manager cannot change settings', coalesce(pg_temp.affected(
    'update public.site_settings set brand_name = brand_name'), 0) = 0);
  perform pg_temp.expect('manager cannot add admins', pg_temp.denied(format(
    'insert into public.admin_profiles (user_id, name, role) values (%L, ''zz-a3 x'', ''staff'')', u_user)));
  perform pg_temp.expect('manager sees only own admin profile',
    pg_temp.n('select 1 from public.admin_profiles') = 1);

  -- owner --------------------------------------------------------------------------
  perform pg_temp.act_as('authenticated', u_owner);
  perform pg_temp.expect('owner: admin_role() is owner', public.admin_role() = 'owner');
  perform pg_temp.expect('owner reads every fixture product', pg_temp.n(fx_prod) = 3);
  perform pg_temp.expect('owner reads hidden content',
    pg_temp.n('select 1 from public.pages where slug like ''zz-a3-%''') = 2);
  perform pg_temp.expect('owner reads orders', pg_temp.n(fx_order) = 1);
  perform pg_temp.expect('owner reads costs',
    pg_temp.n(format('select 1 from public.product_costs where product_id = %L', p_active)) = 1);
  perform pg_temp.expect('owner reads all admin profiles',
    pg_temp.n('select 1 from public.admin_profiles where name like ''zz-a3%''') = 3);
  perform pg_temp.expect('owner can change settings', pg_temp.affected(
    'update public.site_settings set brand_name = brand_name') = 1);
  perform pg_temp.expect('owner reads the activity log',
    pg_temp.n('select 1 from public.activity_log where entity = ''zz-a3''') = 1);
  perform pg_temp.expect('even the owner cannot insert orders directly', pg_temp.denied(
    'insert into public.orders (order_number, customer_name, phone, address, district, subtotal, total)
     values (''HVX-ZZA3Z'', ''zz-a3 z'', ''+8801711000003'', ''House 4, Road 4'', ''Dhaka'', 1, 1)'));

  -- Clean up ------------------------------------------------------------------------
  perform set_config('role', me, true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  delete from public.orders where id = o1;
  delete from public.blocked_phones where reason = 'zz-a3';
  delete from public.subscribers where source = 'zz-a3';
  delete from public.contact_messages where name = 'zz-a3 anon';
  delete from public.activity_log where entity = 'zz-a3';
  delete from public.collections where id in (col_live, col_old);
  delete from public.products where id in (p_active, p_draft, p_arch);
  delete from public.categories where id in (c_vis, c_hid);
  delete from public.delivery_zones where id in (z_on, z_off);
  delete from public.coupons where code = 'ZZ-A3-TEST';
  delete from public.hero_slides where title like 'zz-a3%';
  delete from public.banners where placement = 'zz-a3';
  delete from public.home_sections where key like 'zz_a3%';
  delete from public.pages where slug like 'zz-a3-%';
  delete from public.faqs where question like 'zz-a3%';
  delete from public.testimonials where name like 'zz-a3%';
  delete from auth.users where id in (u_owner, u_manager, u_staff, u_user);
end;
$$;

select 'A3 RLS checks passed' as result;
