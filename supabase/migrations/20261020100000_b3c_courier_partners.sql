-- B3c: courier partner names shown in the storefront footer (empty = row hidden).
alter table public.site_settings
  add column if not exists courier_partners text[] not null default '{}';
