-- WRISTORY · Phase C6b — optional customer accounts (email + password, Supabase Auth)
-- Customers are plain `authenticated` users without an admin_profiles row, so
-- every admin policy and function already treats them like anon (is_admin() is
-- false). This migration only adds what a customer may touch:
-- 1. customer_profiles: name + phone, each customer reads and writes their own row.
-- 2. my_orders(): the customer's orders, matched on their *confirmed* account
--    email (orders.email from checkout). Guest checkout is unchanged; orders
--    still carry no user id. Only summary columns come back (no address).
-- Apply after 20261023100000_contact_details.sql. Test: tests/c6b_customer_accounts_check.sql.
-- Also (👤 dashboard): turn public sign-ups back on and set the site URL /
-- redirect URLs, see supabase/README.md "Customer accounts".

-- ---------------------------------------------------------------------------
-- 1. Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.customer_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text check (name is null or char_length(name) between 2 and 80),
  phone      text check (phone is null or phone ~ '^\+8801[3-9][0-9]{8}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customer_profiles_updated_at on public.customer_profiles;
create trigger customer_profiles_updated_at
  before update on public.customer_profiles
  for each row execute function public.set_updated_at();

alter table public.customer_profiles enable row level security;

revoke all on public.customer_profiles from public, anon, authenticated;
grant select on public.customer_profiles to authenticated;
grant insert (user_id, name, phone) on public.customer_profiles to authenticated;
grant update (name, phone) on public.customer_profiles to authenticated;

drop policy if exists "read: own" on public.customer_profiles;
drop policy if exists "insert: own" on public.customer_profiles;
drop policy if exists "update: own" on public.customer_profiles;
create policy "read: own" on public.customer_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "insert: own" on public.customer_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "update: own" on public.customer_profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 2. Order history by confirmed email
-- ---------------------------------------------------------------------------
create index if not exists orders_email_lower_created_idx
  on public.orders (lower(email), created_at desc) where email is not null;

create or replace function public.my_orders(p_limit integer default 20)
returns table (
  order_number text,
  status       text,
  total        integer,
  item_count   integer,
  created_at   timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    -- The address only counts once Supabase has confirmed it (an unconfirmed
    -- sign-up must not see orders placed with someone else's email).
    select lower(u.email) as email
    from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null and u.email is not null
  )
  select o.order_number, o.status, o.total,
         (select coalesce(sum(oi.qty), 0)::int from public.order_items oi where oi.order_id = o.id),
         o.created_at
  from public.orders o
  join me on lower(o.email) = me.email
  order by o.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

revoke execute on function public.my_orders(integer) from public, anon, authenticated;
grant execute on function public.my_orders(integer) to authenticated;
