-- B29b checks. Run in the SQL editor after applying 20261020120000_b29b_site_settings.sql.
-- Everything is rolled back at the end.
begin;

-- 1) Maintenance mode: place_order refuses with the `maintenance` token.
update public.site_settings set maintenance_mode = true;
do $$
begin
  perform public.place_order('[]'::jsonb, null, 'Test Person', '01712345678', 'House 1, Road 2, Dhaka');
  raise exception 'FAIL: place_order accepted an order during maintenance';
exception when others then
  if sqlerrm <> 'maintenance' then raise exception 'FAIL: expected maintenance, got %', sqlerrm; end if;
end;
$$;
update public.site_settings set maintenance_mode = false;

-- 2) Anonymous callers cannot use the manager functions.
set local role anon;
do $$
begin
  perform public.set_free_delivery_threshold(1000);
  raise exception 'FAIL: anon ran set_free_delivery_threshold';
exception when insufficient_privilege then null;
end;
$$;
do $$
begin
  perform public.set_announcements('[]'::jsonb);
  raise exception 'FAIL: anon ran set_announcements';
exception when insufficient_privilege then null;
end;
$$;
reset role;

-- 3) Manager checks need a signed-in manager session (SQL editor runs as postgres, so
--    is_manager() is false here): verify the guard itself.
do $$
begin
  perform public.set_free_delivery_threshold(1000);
  raise exception 'FAIL: non-manager changed the threshold';
exception when others then
  if sqlerrm <> 'forbidden' then raise exception 'FAIL: expected forbidden, got %', sqlerrm; end if;
end;
$$;

select 'b29b checks passed' as result;
rollback;
