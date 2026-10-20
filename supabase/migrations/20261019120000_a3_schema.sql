-- WRISTORY · Phase A3 · 1/3 — tables, constraints, indexes, triggers (roadmap §9.4)
-- Money is whole taka (integer). Phones are stored as +8801XXXXXXXXX.
-- Status-like fields use text + CHECK instead of enums so they're easy to extend.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin users
-- ---------------------------------------------------------------------------
create table public.admin_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  role       text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  image       text,
  description text,
  parent_id   uuid references public.categories (id) on delete set null,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  check (parent_id is distinct from id)
);
create index categories_parent_idx on public.categories (parent_id);
create index categories_sort_idx on public.categories (sort_order);

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name             text not null,
  sku              text unique,
  category_id      uuid references public.categories (id) on delete set null,
  gender           text not null default 'unisex' check (gender in ('men', 'women', 'unisex')),
  short_desc       text,
  description      text,
  price            integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  stock            integer not null default 0 check (stock >= 0),
  low_stock_at     integer not null default 3 check (low_stock_at >= 0),
  status           text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  badges           text[] not null default '{}'
                   check (badges <@ array['new', 'sale', 'limited']::text[]),
  specs            jsonb not null default '{}'::jsonb check (jsonb_typeof(specs) = 'object'),
  is_featured      boolean not null default false,
  is_bestseller    boolean not null default false,
  sort_order       integer not null default 0,
  seo_title        text,
  seo_desc         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_status_sort_idx on public.products (status, sort_order);
create index products_featured_idx on public.products (status) where is_featured;
create index products_bestseller_idx on public.products (status) where is_bestseller;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- cost_price lives in its own admin-only table so the public products table
-- never carries it (RLS is row-level; a separate table is simpler than column grants).
create table public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  cost_price integer not null check (cost_price >= 0),
  updated_at timestamptz not null default now()
);
create trigger product_costs_updated_at before update on public.product_costs
  for each row execute function public.set_updated_at();

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  url          text not null,
  alt          text not null default '',
  is_lifestyle boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  name           text not null,
  sku            text unique,
  price_override integer check (price_override is null or price_override >= 0),
  stock          integer not null default 0 check (stock >= 0),
  swatch_hex     text check (swatch_hex is null or swatch_hex ~ '^#[0-9A-Fa-f]{6}$'),
  image_id       uuid references public.product_images (id) on delete set null,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants (product_id, sort_order);
create index product_variants_image_idx on public.product_variants (image_id);

create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title       text not null,
  description text,
  banner      text,
  mode        text not null default 'manual' check (mode in ('manual', 'rules')),
  rules       jsonb not null default '{}'::jsonb check (jsonb_typeof(rules) = 'object'),
  active_from timestamptz,
  active_to   timestamptz,
  is_visible  boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  check (active_to is null or active_from is null or active_to > active_from)
);

create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  sort_order    integer not null default 0,
  primary key (collection_id, product_id)
);
create index collection_products_product_idx on public.collection_products (product_id);

create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  rating     smallint not null check (rating between 1 and 5),
  text       text check (char_length(text) <= 2000),
  photo_url  text,
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index reviews_product_status_idx on public.reviews (product_id, status);
create index reviews_status_created_idx on public.reviews (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Delivery, coupons, orders
-- ---------------------------------------------------------------------------
create table public.delivery_zones (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  charge     integer not null check (charge >= 0),
  eta_text   text,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.coupons (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,32}$'),
  type       text not null check (type in ('percent', 'fixed', 'free_shipping')),
  value      integer not null default 0 check (value >= 0),
  min_order  integer not null default 0 check (min_order >= 0),
  max_uses   integer check (max_uses is null or max_uses > 0),
  used       integer not null default 0 check (used >= 0),
  starts_at  timestamptz,
  ends_at    timestamptz,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  check (type <> 'percent' or value between 1 and 100),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique check (order_number ~ '^HVX-[0-9A-Z]{5,}$'),
  customer_name   text not null check (char_length(customer_name) between 2 and 80),
  phone           text not null check (phone ~ '^\+8801[3-9][0-9]{8}$'),
  email           text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  address         text not null check (char_length(address) between 5 and 300),
  district        text not null,
  zone_id         uuid references public.delivery_zones (id) on delete set null,
  delivery_charge integer not null default 0 check (delivery_charge >= 0),
  subtotal        integer not null check (subtotal >= 0),
  discount        integer not null default 0 check (discount >= 0),
  coupon_code     text,
  total           integer not null check (total >= 0),
  payment_method  text not null default 'COD' check (payment_method = 'COD'),
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned')),
  courier         text,
  tracking_id     text,
  customer_note   text check (char_length(customer_note) <= 500),
  admin_note      text,
  ip              inet,
  user_agent      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_phone_created_idx on public.orders (phone, created_at desc);
create index orders_ip_created_idx on public.orders (ip, created_at desc);
create index orders_zone_idx on public.orders (zone_id);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  variant_id     uuid references public.product_variants (id) on delete set null,
  name_snapshot  text not null,
  variant_snapshot text,
  image_snapshot text,
  unit_price     integer not null check (unit_price >= 0),
  qty            integer not null check (qty between 1 and 99)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index order_items_variant_idx on public.order_items (variant_id);

create table public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references auth.users (id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);
create index order_status_history_changed_by_idx on public.order_status_history (changed_by);

-- Every status change is logged, whoever makes it (admin UI, SQL, place_order).
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;
create trigger orders_status_history
  after insert or update of status on public.orders
  for each row execute function public.log_order_status_change();

create table public.blocked_phones (
  phone      text primary key check (phone ~ '^\+8801[3-9][0-9]{8}$'),
  reason     text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index blocked_phones_created_by_idx on public.blocked_phones (created_by);

-- ---------------------------------------------------------------------------
-- Homepage & content
-- ---------------------------------------------------------------------------
create table public.hero_slides (
  id            uuid primary key default gen_random_uuid(),
  eyebrow       text,
  title         text not null,
  subtitle      text,
  cta_label     text,
  cta_link      text,
  image_desktop text,
  image_mobile  text,
  video_url     text,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  active_from   timestamptz,
  active_to     timestamptz,
  created_at    timestamptz not null default now(),
  check (active_to is null or active_from is null or active_to > active_from)
);

create table public.banners (
  id           uuid primary key default gen_random_uuid(),
  placement    text not null,
  title        text,
  subtitle     text,
  image        text,
  image_mobile text,
  link         text,
  countdown_to timestamptz,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index banners_placement_idx on public.banners (placement, sort_order);

create table public.home_sections (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique check (key ~ '^[a-z0-9_]+$'),
  title      text,
  subtitle   text,
  config     jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger home_sections_updated_at before update on public.home_sections
  for each row execute function public.set_updated_at();

-- Single row, enforced by a boolean primary key that can only be true.
create table public.site_settings (
  id                      boolean primary key default true check (id),
  brand_name              text not null default 'WRISTORY',
  logo_url                text,
  logo_light_url          text,
  favicon_url             text,
  og_image_url            text,
  contact_phone           text,
  whatsapp_number         text,
  contact_email           text,
  address                 text,
  socials                 jsonb not null default '{}'::jsonb check (jsonb_typeof(socials) = 'object'),
  announcements           jsonb not null default '[]'::jsonb check (jsonb_typeof(announcements) = 'array'),
  footer_text             text,
  free_delivery_threshold integer check (free_delivery_threshold is null or free_delivery_threshold >= 0),
  seo_title               text,
  seo_desc                text,
  ga4_id                  text,
  fb_pixel_id             text,
  maintenance_mode        boolean not null default false,
  updated_at              timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
insert into public.site_settings (id) values (true) on conflict (id) do nothing;

create table public.pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null,
  content      text not null default '',
  seo_desc     text,
  is_published boolean not null default true,
  updated_at   timestamptz not null default now()
);
create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();

create table public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  topic      text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  location   text,
  text       text not null,
  rating     smallint check (rating is null or rating between 1 and 5),
  photo_url  text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Inbound (public write-only)
-- ---------------------------------------------------------------------------
create table public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  phone      text check (phone is null or phone ~ '^\+8801[3-9][0-9]{8}$'),
  email      text check (email is null or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  source     text check (char_length(source) <= 40),
  created_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);
create index subscribers_created_idx on public.subscribers (created_at desc);

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 80),
  phone      text check (phone is null or phone ~ '^\+8801[3-9][0-9]{8}$'),
  email      text check (email is null or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  message    text not null check (char_length(message) between 1 and 2000),
  status     text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);
create index contact_messages_status_created_idx on public.contact_messages (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  actor      uuid references auth.users (id) on delete set null default auth.uid(),
  action     text not null,
  entity     text not null,
  entity_id  text,
  diff       jsonb,
  created_at timestamptz not null default now()
);
create index activity_log_created_idx on public.activity_log (created_at desc);
create index activity_log_entity_idx on public.activity_log (entity, entity_id);
create index activity_log_actor_idx on public.activity_log (actor);
