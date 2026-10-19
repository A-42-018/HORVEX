-- HORVEX · Phase A3 · 2/3 — role helpers, grants, Row Level Security
-- Roles (roadmap §10): owner = everything · manager = all except users/settings · staff = orders only.
-- Anyone signed in without an admin_profiles row is treated like anon.
-- Policies wrap helpers in (select …) so Postgres evaluates them once per statement.

-- ---------------------------------------------------------------------------
-- Role helpers (security definer: they read admin_profiles past its own RLS)
-- ---------------------------------------------------------------------------
create or replace function public.admin_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.admin_profiles where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid());
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and role in ('owner', 'manager')
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and role = 'owner'
  );
$$;

-- Trigger functions are never called directly.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.log_order_status_change() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Customers: built from orders. security_invoker makes the orders RLS apply.
-- ---------------------------------------------------------------------------
create view public.admin_customers
with (security_invoker = true)
as
select
  o.phone,
  (array_agg(o.customer_name order by o.created_at desc))[1]                           as name,
  (array_agg(o.email order by o.created_at desc) filter (where o.email is not null))[1] as email,
  (array_agg(o.district order by o.created_at desc))[1]                                as district,
  count(*)::int                                                                        as orders_count,
  coalesce(sum(o.total) filter (where o.status = 'delivered'), 0)::int                 as total_spent,
  count(*) filter (where o.status = 'delivered')::int                                  as delivered_count,
  count(*) filter (where o.status in ('cancelled', 'returned'))::int                   as cancelled_count,
  min(o.created_at)                                                                    as first_order_at,
  max(o.created_at)                                                                    as last_order_at,
  exists (select 1 from public.blocked_phones b where b.phone = o.phone)               as is_blocked
from public.orders o
group by o.phone;

-- ---------------------------------------------------------------------------
-- Table privileges. RLS decides rows; grants decide which roles may try at all.
-- anon gets SELECT only on storefront tables and INSERT only on the two inbound
-- forms. Sensitive tables (orders, customers, costs, coupons…) aren't granted to
-- anon, so a request fails with "permission denied" before RLS even runs.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.categories, public.products, public.product_images, public.product_variants,
  public.collections, public.collection_products, public.reviews, public.delivery_zones,
  public.hero_slides, public.banners, public.home_sections, public.site_settings,
  public.pages, public.faqs, public.testimonials
to anon;
grant insert on public.subscribers, public.contact_messages to anon;

grant select, insert, update, delete on all tables in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table in public (no table is left open by accident).
-- ---------------------------------------------------------------------------
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storefront tables: public reads published rows, any admin reads all,
-- managers and owners write.
-- ---------------------------------------------------------------------------
create policy "read: visible or admin" on public.categories
  for select to anon, authenticated
  using (is_visible or (select public.is_admin()));

create policy "read: active or admin" on public.products
  for select to anon, authenticated
  using (status = 'active' or (select public.is_admin()));

create policy "read: of active product or admin" on public.product_images
  for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    or (select public.is_admin())
  );

create policy "read: of active product or admin" on public.product_variants
  for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    or (select public.is_admin())
  );

create policy "read: visible and in window, or admin" on public.collections
  for select to anon, authenticated
  using (
    (is_visible
      and (active_from is null or active_from <= now())
      and (active_to is null or active_to > now()))
    or (select public.is_admin())
  );

create policy "read: visible collection and active product, or admin" on public.collection_products
  for select to anon, authenticated
  using (
    (exists (
      select 1 from public.collections c
      where c.id = collection_id and c.is_visible
        and (c.active_from is null or c.active_from <= now())
        and (c.active_to is null or c.active_to > now()))
     and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'))
    or (select public.is_admin())
  );

create policy "read: approved or admin" on public.reviews
  for select to anon, authenticated
  using (status = 'approved' or (select public.is_admin()));

create policy "read: active or admin" on public.delivery_zones
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "read: active and in window, or admin" on public.hero_slides
  for select to anon, authenticated
  using (
    (is_active
      and (active_from is null or active_from <= now())
      and (active_to is null or active_to > now()))
    or (select public.is_admin())
  );

create policy "read: active or admin" on public.banners
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "read: visible or admin" on public.home_sections
  for select to anon, authenticated
  using (is_visible or (select public.is_admin()));

create policy "read: published or admin" on public.pages
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "read: visible or admin" on public.faqs
  for select to anon, authenticated
  using (is_visible or (select public.is_admin()));

create policy "read: visible or admin" on public.testimonials
  for select to anon, authenticated
  using (is_visible or (select public.is_admin()));

create policy "read: everyone" on public.site_settings
  for select to anon, authenticated
  using (true);

-- Manager+ writes on catalog, homepage and content tables (same three policies each).
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'products', 'product_images', 'product_variants', 'collections',
    'collection_products', 'reviews', 'delivery_zones', 'hero_slides', 'banners',
    'home_sections', 'pages', 'faqs', 'testimonials'
  ] loop
    execute format(
      'create policy "insert: manager" on public.%I for insert to authenticated
         with check ((select public.is_manager()))', t);
    execute format(
      'create policy "update: manager" on public.%I for update to authenticated
         using ((select public.is_manager())) with check ((select public.is_manager()))', t);
    execute format(
      'create policy "delete: manager" on public.%I for delete to authenticated
         using ((select public.is_manager()))', t);
  end loop;
end;
$$;

-- Settings: owner only. The single row already exists, so no insert/delete.
create policy "update: owner" on public.site_settings
  for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

-- ---------------------------------------------------------------------------
-- Admin-only tables
-- ---------------------------------------------------------------------------
-- Cost price and coupons: manager+ (staff work orders only).
create policy "all: manager" on public.product_costs
  for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));

create policy "all: manager" on public.coupons
  for all to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));

-- Orders: no INSERT policy for anyone. Orders are created only by the
-- security-definer place_order() function (Phase A4), which re-prices server-side.
create policy "read: admin" on public.orders
  for select to authenticated
  using ((select public.is_admin()));
create policy "update: admin" on public.orders
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "delete: manager" on public.orders
  for delete to authenticated
  using ((select public.is_manager()));

create policy "read: admin" on public.order_items
  for select to authenticated
  using ((select public.is_admin()));
create policy "insert: manager" on public.order_items
  for insert to authenticated
  with check ((select public.is_manager()));
create policy "update: manager" on public.order_items
  for update to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));
create policy "delete: manager" on public.order_items
  for delete to authenticated
  using ((select public.is_manager()));

-- Status history is append-only (the orders trigger writes it; admins may add notes).
create policy "read: admin" on public.order_status_history
  for select to authenticated
  using ((select public.is_admin()));
create policy "insert: admin as self" on public.order_status_history
  for insert to authenticated
  with check ((select public.is_admin()) and changed_by = (select auth.uid()));

-- Any admin can block a phone from the order screen.
create policy "all: admin" on public.blocked_phones
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Inbound forms: anyone may submit; only managers read or manage.
create policy "insert: anyone" on public.subscribers
  for insert to anon, authenticated
  with check (true);
create policy "read: manager" on public.subscribers
  for select to authenticated
  using ((select public.is_manager()));
create policy "delete: manager" on public.subscribers
  for delete to authenticated
  using ((select public.is_manager()));

create policy "insert: anyone, as new" on public.contact_messages
  for insert to anon, authenticated
  with check (status = 'new');
create policy "read: manager" on public.contact_messages
  for select to authenticated
  using ((select public.is_manager()));
create policy "update: manager" on public.contact_messages
  for update to authenticated
  using ((select public.is_manager())) with check ((select public.is_manager()));
create policy "delete: manager" on public.contact_messages
  for delete to authenticated
  using ((select public.is_manager()));

-- Admin users: each admin reads their own row (for the role guard); only the
-- owner manages staff, so nobody can promote themselves.
create policy "read: self or owner" on public.admin_profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_owner()));
create policy "insert: owner" on public.admin_profiles
  for insert to authenticated
  with check ((select public.is_owner()));
create policy "update: owner" on public.admin_profiles
  for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "delete: owner" on public.admin_profiles
  for delete to authenticated
  using ((select public.is_owner()));

-- Activity log: append-only. Admins write entries as themselves; managers read.
create policy "insert: admin as self" on public.activity_log
  for insert to authenticated
  with check ((select public.is_admin()) and actor = (select auth.uid()));
create policy "read: manager" on public.activity_log
  for select to authenticated
  using ((select public.is_manager()));

-- The customers view is admin-only (and RLS on orders filters it further).
revoke all on public.admin_customers from anon, authenticated;
grant select on public.admin_customers to authenticated;
