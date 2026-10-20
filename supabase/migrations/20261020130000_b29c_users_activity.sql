-- B29c: admin users (owner only) and the activity log viewer (manager+).
-- Creating a sign-in needs the service role, which never reaches the browser, so
-- the owner first creates the user in Supabase (Authentication > Users) and then
-- grants a role here by email. All functions are security definer and check the
-- caller's role themselves.

create or replace function public.admin_users()
returns table (user_id uuid, name text, email text, role text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  return query
    select p.user_id, p.name, u.email::text, p.role, p.created_at, u.last_sign_in_at
    from public.admin_profiles p
    left join auth.users u on u.id = p.user_id
    order by case p.role when 'owner' then 0 when 'manager' then 1 else 2 end, p.created_at;
end;
$$;

create or replace function public.add_admin_user(p_email text, p_name text, p_role text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_owner() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if p_role not in ('owner', 'manager', 'staff') then
    raise exception using errcode = 'P0001', message = 'invalid_role';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then
    raise exception using errcode = 'P0001', message = 'invalid_name';
  end if;
  select id into v_id from auth.users where lower(email) = lower(btrim(coalesce(p_email, '')));
  if v_id is null then
    raise exception using errcode = 'P0001', message = 'user_not_found';
  end if;
  if exists (select 1 from public.admin_profiles where user_id = v_id) then
    raise exception using errcode = 'P0001', message = 'already_admin';
  end if;
  insert into public.admin_profiles (user_id, name, role) values (v_id, btrim(p_name), p_role);
  return v_id;
end;
$$;

-- An owner can't change their own role or remove themselves, so the store always keeps an owner.
create or replace function public.set_admin_role(p_user uuid, p_role text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if p_role not in ('owner', 'manager', 'staff') then
    raise exception using errcode = 'P0001', message = 'invalid_role';
  end if;
  if p_user = auth.uid() then
    raise exception using errcode = 'P0001', message = 'cannot_change_self';
  end if;
  update public.admin_profiles set role = p_role where user_id = p_user;
  if not found then
    raise exception using errcode = 'P0001', message = 'user_not_found';
  end if;
end;
$$;

create or replace function public.remove_admin_user(p_user uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  if p_user = auth.uid() then
    raise exception using errcode = 'P0001', message = 'cannot_change_self';
  end if;
  delete from public.admin_profiles where user_id = p_user;
  if not found then
    raise exception using errcode = 'P0001', message = 'user_not_found';
  end if;
end;
$$;

-- Activity log with the actor's name (managers can't read admin_profiles directly).
create or replace function public.admin_activity_log(p_entity text default null, p_limit integer default 50)
returns table (id uuid, actor uuid, actor_name text, action text, entity text, entity_id text, diff jsonb, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_manager() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  return query
    select l.id, l.actor, p.name, l.action, l.entity, l.entity_id, l.diff, l.created_at
    from public.activity_log l
    left join public.admin_profiles p on p.user_id = l.actor
    where p_entity is null or l.entity = p_entity
    order by l.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 500);
end;
$$;

create or replace function public.admin_activity_entities()
returns setof text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_manager() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  return query select distinct l.entity from public.activity_log l order by 1;
end;
$$;

revoke all on function public.admin_users() from public, anon;
revoke all on function public.add_admin_user(text, text, text) from public, anon;
revoke all on function public.set_admin_role(uuid, text) from public, anon;
revoke all on function public.remove_admin_user(uuid) from public, anon;
revoke all on function public.admin_activity_log(text, integer) from public, anon;
revoke all on function public.admin_activity_entities() from public, anon;
grant execute on function public.admin_users() to authenticated;
grant execute on function public.add_admin_user(text, text, text) to authenticated;
grant execute on function public.set_admin_role(uuid, text) to authenticated;
grant execute on function public.remove_admin_user(uuid) to authenticated;
grant execute on function public.admin_activity_log(text, integer) to authenticated;
grant execute on function public.admin_activity_entities() to authenticated;
