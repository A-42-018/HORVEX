-- WRISTORY · Phase A3 · 3/3 — storage buckets and policies
-- Buckets are public, so files load by URL (CDN) without any policy. There is
-- deliberately no anon SELECT policy: the public can fetch a known URL but can't
-- list bucket contents. Managers and owners upload, replace and delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('site-media', 'site-media', true, 52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/x-icon', 'video/mp4', 'video/webm']),
  ('review-photos', 'review-photos', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Admins can list (needed by the media picker and for upsert).
create policy "wristory: admin read" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('product-images', 'site-media', 'review-photos')
    and (select public.is_admin())
  );

create policy "wristory: manager upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-images', 'site-media', 'review-photos')
    and (select public.is_manager())
  );

create policy "wristory: manager update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('product-images', 'site-media', 'review-photos')
    and (select public.is_manager())
  )
  with check (
    bucket_id in ('product-images', 'site-media', 'review-photos')
    and (select public.is_manager())
  );

create policy "wristory: manager delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('product-images', 'site-media', 'review-photos')
    and (select public.is_manager())
  );
