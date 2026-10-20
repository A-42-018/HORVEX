-- Block B review fix: the activity log viewer loads one page at a time, so
-- admin_activity_log takes an offset. Same checks and limit cap as B29c; the
-- old two-argument version is dropped so PostgREST has one function to call.

drop function if exists public.admin_activity_log(text, integer);

create function public.admin_activity_log(p_entity text default null, p_limit integer default 50, p_offset integer default 0)
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
    order by l.created_at desc, l.id
    limit least(greatest(coalesce(p_limit, 50), 1), 500)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.admin_activity_log(text, integer, integer) from public, anon;
grant execute on function public.admin_activity_log(text, integer, integer) to authenticated;
