-- B29c checks. Run in the SQL editor after applying 20261020130000_b29c_users_activity.sql.
-- Everything is rolled back at the end.
begin;

-- Anonymous callers cannot use any of the new functions.
set local role anon;
do $$ begin perform public.admin_users(); raise exception 'FAIL: anon ran admin_users';
exception when insufficient_privilege then null; end $$;
do $$ begin perform public.admin_activity_log(); raise exception 'FAIL: anon ran admin_activity_log';
exception when insufficient_privilege then null; end $$;
do $$ begin perform public.remove_admin_user(gen_random_uuid()); raise exception 'FAIL: anon ran remove_admin_user';
exception when insufficient_privilege then null; end $$;
reset role;

-- A signed-in user with no admin profile is refused (forbidden).
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
do $$ begin perform public.admin_users(); raise exception 'FAIL: non-admin ran admin_users';
exception when others then if sqlerrm <> 'forbidden' then raise exception 'FAIL: expected forbidden, got %', sqlerrm; end if; end $$;
do $$ begin perform public.admin_activity_log(); raise exception 'FAIL: non-admin read the log';
exception when others then if sqlerrm <> 'forbidden' then raise exception 'FAIL: expected forbidden, got %', sqlerrm; end if; end $$;
reset role;

select 'b29c checks passed' as result;
rollback;
