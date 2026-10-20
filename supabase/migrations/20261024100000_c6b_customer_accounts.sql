-- WRISTORY · Phase C6b — optional customer accounts (email + password, Supabase Auth)
-- Customers are plain `authenticated` users without an admin_profiles row, so
-- every admin policy and function already treats them like anon (is_admin() is
-- false). This migration only adds what a customer may touch:
-- 1. customer_profiles: name + phone, each customer reads and writes their own row.
-- 2. orders.user_id: set by place_order from the caller's token (auth.uid()) when a
--    signed-in customer checks out. Guests (anon) get null. There is no argument
--    for it, so nobody can attach an order to another account.
-- 3. my_orders(): the caller's own orders (user_id = auth.uid()), summary columns only.
--    Not matched on email: with "Confirm email" off, anyone could sign up with
--    someone else's address.
-- Apply after 20261023100000_contact_details.sql. Test: tests/c6b_customer_accounts_check.sql.
-- Also (👤 dashboard): sign-ups on, "Confirm email" off, see supabase/README.md "Customer accounts".

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
-- 2. Orders placed while signed in
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc) where user_id is not null;
-- (C5's column grants already keep user_id out of the API's UPDATE rights.)

-- The C5 wrapper, plus: a signed-in caller's order is linked to their account.
-- place_order_checked (the engine) is unchanged.
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
  p_website       text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ip  text := host(public.request_ip());
  v_uid uuid := auth.uid();
  r     jsonb;
begin
  if public.coupon_locked(p_coupon_code) then
    raise exception using errcode = 'P0001', message = 'invalid_coupon';
  end if;
  begin
    r := public.place_order_checked(p_items, p_zone_id, p_customer_name, p_phone, p_address,
                                    p_district, p_email, p_note, p_coupon_code, p_website);
  exception when raise_exception then
    if sqlerrm = 'invalid_coupon' and v_ip is not null then
      perform public.note_attempt('coupon_miss', v_ip);
      return jsonb_build_object('error', 'invalid_coupon');
    end if;
    raise;
  end;
  if v_uid is not null and r ? 'order_id' and exists (select 1 from auth.users u where u.id = v_uid) then
    update public.orders set user_id = v_uid where id = (r ->> 'order_id')::uuid;
  end if;
  return r;
end;
$$;

revoke execute on function public.place_order(jsonb, uuid, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.place_order(jsonb, uuid, text, text, text, text, text, text, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Order history
-- ---------------------------------------------------------------------------
drop function if exists public.my_orders(integer);
create function public.my_orders(p_limit integer default 20)
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
  select o.order_number, o.status, o.total,
         (select coalesce(sum(oi.qty), 0)::int from public.order_items oi where oi.order_id = o.id),
         o.created_at
  from public.orders o
  where o.user_id = auth.uid()
  order by o.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

revoke execute on function public.my_orders(integer) from public, anon, authenticated;
grant execute on function public.my_orders(integer) to authenticated;
