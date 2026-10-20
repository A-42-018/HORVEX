-- B21c: stream new orders to the admin panel (Supabase Realtime).
-- Realtime applies the table's RLS to every subscriber: the "read: admin" policy
-- on public.orders means only signed-in staff receive these events; storefront
-- visitors (anon) get nothing. INSERT events need no replica-identity change.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end
$$;
