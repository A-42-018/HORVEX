-- HORVEX · Phase A4 — starter content. Run once in the SQL Editor after the migrations.
-- Catalog: 7 categories, 24 watches (3 with variants), 2 collections, approved reviews.
-- Store: 3 delivery zones, site settings, homepage sections, hero slides, a promo banner,
-- FAQs, testimonials and policy pages.
--
-- PLACEHOLDERS: product photos are Unsplash stock (some show other brands' dials) and
-- the policy/FAQ copy is a starting draft. Replace both with the client's own before launch.
-- Contact details and socials are left empty on purpose; fill them in Admin → Settings.
--
-- It refuses to run on a catalog that already has products, so it can't duplicate data.

do $$
begin
  if exists (select 1 from public.products) or exists (select 1 from public.categories) then
    raise exception 'seed.sql expects an empty catalog (products/categories already exist)';
  end if;
end;
$$;

-- Placeholder image URL: Unsplash photo id → 4:5 crop (B5 swaps the w/h params for srcset).
create or replace function pg_temp.img(photo text, w int default 1200, h int default 1500)
returns text language sql immutable as $$
  select format('https://images.unsplash.com/photo-%s?auto=format&fit=crop&w=%s&h=%s&q=80', photo, w, h)
$$;

-- ---------------------------------------------------------------------------
-- Categories. A product has one category: its style (automatic-skeleton, chain,
-- leather, couple, accessories). "men" and "women" are gender landing pages: they
-- list products by products.gender (plus unisex), not by category_id.
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, description, image, sort_order, is_visible) values
  ('men', 'Men', 'Bold cases, steel and leather. Built for every day and the days that matter.',
    pg_temp.img('1587836374828-4dbafa94cf0e', 900, 1200), 1, true),
  ('women', 'Women', 'Refined dials and slim cases in rose, gold and steel.',
    pg_temp.img('1524592094714-0f0654e20314', 900, 1200), 2, true),
  ('couple', 'Couple', 'Matched pairs, boxed together. The gift that keeps time.',
    pg_temp.img('1619134778706-7015533a6150', 900, 1200), 3, true),
  ('automatic-skeleton', 'Automatic & Skeleton', 'Self-winding movements you can watch at work.',
    pg_temp.img('1609587312208-cea54be969e7', 900, 1200), 4, true),
  ('chain', 'Chain', 'Stainless steel bracelets and mesh straps.',
    pg_temp.img('1594534475808-b18fc33b045e', 900, 1200), 5, true),
  ('leather', 'Leather', 'Genuine leather straps that soften with wear.',
    pg_temp.img('1612817159949-195b6eb9e31a', 900, 1200), 6, true),
  -- Hidden until accessories (boxes, straps, winders) are added.
  ('accessories', 'Accessories', 'Straps, boxes and winders.', null, 7, false);

-- ---------------------------------------------------------------------------
-- Products. Prices are whole taka. Specs share one key set (roadmap §9.4).
-- ---------------------------------------------------------------------------
insert into public.products (
  slug, name, sku, category_id, gender, short_desc, description, price, compare_at_price,
  stock, low_stock_at, status, badges, specs, is_featured, is_bestseller, sort_order)
select
  d.slug, d.name, format('HX-%s', lpad(d.ord::text, 3, '0')),
  (select c.id from public.categories c where c.slug = d.cat),
  d.gender, d.short_desc,
  d.short_desc || ' Every HORVEX is quality-checked before it ships, arrives in a gift box with a warranty card, and is paid for only after you have checked it at your door.',
  d.price, d.compare_at, d.stock, 3, 'active', d.badges,
  jsonb_build_object(
    'case_size', d.case_size, 'case_material', d.case_material, 'strap', d.strap,
    'movement', d.movement, 'glass', d.glass, 'water_resistance', d.wr, 'weight', d.weight,
    'warranty', case when d.movement like '%automatic%' then '2-year movement warranty'
                     else '1-year movement warranty' end,
    'box_contents', case when d.cat = 'couple' then 'HORVEX pair box, 2 warranty cards, link-removal tool'
                         else 'HORVEX gift box, warranty card, care guide' end),
  d.featured, d.bestseller, d.ord
from (values
  -- ord, slug, name, cat, gender, price, compare_at, stock, badges, featured, bestseller,
  -- short_desc, case_size, case_material, strap, movement, glass, wr, weight
  (1, 'meridian-classic', 'Meridian Classic', 'leather', 'men', 4490, 5490, 18, '{sale}'::text[], true, true,
   'A clean black dial with baton indices on a dark leather strap.',
   '41 mm', '316L stainless steel', 'Genuine leather, black', 'Japanese quartz', 'Sapphire-coated mineral', '5 ATM', '72 g'),
  (2, 'atlas-chronograph', 'Atlas Chronograph', 'leather', 'men', 6990, 8490, 12, '{sale}', true, false,
   'A cream panda-dial chronograph with a tachymeter bezel.',
   '43 mm', '316L stainless steel', 'Genuine leather, brown', 'Japanese quartz chronograph', 'Mineral crystal', '5 ATM', '88 g'),
  (3, 'regent-blue', 'Regent Blue', 'leather', 'men', 5290, null, 14, '{new}', false, false,
   'A sunburst blue dial in a gold-tone case on navy leather.',
   '42 mm', '316L stainless steel, gold PVD', 'Genuine leather, navy', 'Japanese quartz', 'Sapphire-coated mineral', '3 ATM', '74 g'),
  (4, 'corsa-chronograph', 'Corsa Chronograph', 'leather', 'men', 7490, null, 9, '{}', false, false,
   'A racing-inspired chronograph with contrast sub-dials.',
   '42 mm', '316L stainless steel', 'Genuine leather, dark brown', 'Japanese quartz chronograph', 'Mineral crystal', '5 ATM', '86 g'),
  (5, 'tempo-field', 'Tempo Field', 'leather', 'unisex', 2990, null, 0, '{}', false, true,
   'A crisp white field dial on a soft suede strap. Three strap colours.',
   '38 mm', '316L stainless steel', 'Suede leather', 'Japanese quartz', 'Mineral crystal', '3 ATM', '58 g'),
  (6, 'celeste-rose', 'Celeste Rose', 'leather', 'women', 3990, 4690, 0, '{sale}', true, true,
   'A white dial framed in rose gold on a slim taupe strap.',
   '36 mm', '316L stainless steel, rose gold PVD', 'Genuine leather', 'Japanese quartz', 'Sapphire-coated mineral', '3 ATM', '48 g'),
  (7, 'aria-chronograph', 'Aria Chronograph', 'leather', 'women', 5690, null, 10, '{new}', true, false,
   'A blush chronograph with rose-gold hands and a date window.',
   '38 mm', '316L stainless steel, rose gold PVD', 'Genuine leather, rose', 'Japanese quartz chronograph', 'Mineral crystal', '3 ATM', '62 g'),
  (8, 'vela-petite', 'Vela Petite', 'leather', 'women', 2890, null, 16, '{}', false, false,
   'A petite white dial on a powder-blue strap. Light enough to forget.',
   '32 mm', '316L stainless steel', 'Genuine leather, powder blue', 'Japanese quartz', 'Mineral crystal', '3 ATM', '38 g'),
  (9, 'sterling-diver', 'Sterling Diver', 'chain', 'men', 8990, 10990, 7, '{sale}', true, true,
   'A black diver with a ceramic-look bezel and an Oyster-style bracelet.',
   '41 mm', '316L stainless steel', 'Stainless steel bracelet', 'Japanese quartz', 'Sapphire-coated mineral', '10 ATM', '142 g'),
  (10, 'orion-explorer', 'Orion Explorer', 'chain', 'men', 7990, null, 8, '{}', false, false,
   'A legible 3-6-9 explorer dial on a brushed steel bracelet.',
   '40 mm', '316L stainless steel', 'Stainless steel bracelet', 'Japanese quartz', 'Sapphire-coated mineral', '10 ATM', '128 g'),
  (11, 'abyss-deep', 'Abyss Deep', 'chain', 'men', 9990, null, 0, '{limited}', false, false,
   'An oversized deep-sea diver with a rotating timing bezel.',
   '44 mm', '316L stainless steel', 'Stainless steel bracelet', 'Japanese quartz', 'Sapphire-coated mineral', '20 ATM', '168 g'),
  (12, 'nautica-chronograph', 'Nautica Chronograph', 'chain', 'men', 10490, null, 6, '{new}', true, false,
   'A slate-grey chronograph with orange accents and a wave-pattern dial.',
   '44 mm', '316L stainless steel', 'Stainless steel bracelet', 'Japanese quartz chronograph', 'Sapphire-coated mineral', '10 ATM', '156 g'),
  (13, 'monarch-steel', 'Monarch Steel', 'chain', 'men', 6490, null, 0, '{}', false, true,
   'A sunray dial on a solid-link bracelet. Two dial colours.',
   '41 mm', '316L stainless steel', 'Stainless steel bracelet', 'Japanese quartz', 'Sapphire-coated mineral', '5 ATM', '134 g'),
  (14, 'ember-chronograph', 'Ember Chronograph', 'chain', 'men', 7290, 8290, 11, '{sale}', false, false,
   'A bronze-tone chronograph on a fine mesh bracelet.',
   '44 mm', '316L stainless steel, bronze IP', 'Stainless steel mesh', 'Japanese quartz chronograph', 'Mineral crystal', '5 ATM', '118 g'),
  (15, 'noctis-minimal', 'Noctis Minimal', 'chain', 'unisex', 2790, 3290, 22, '{sale}', false, true,
   'A matte black dial with a single colour-pop seconds hand.',
   '40 mm', '316L stainless steel', 'Stainless steel mesh', 'Japanese quartz', 'Mineral crystal', '3 ATM', '82 g'),
  (16, 'lumen-gold', 'Lumen Gold', 'chain', 'women', 4990, 5990, 9, '{sale}', false, false,
   'A champagne dial on a gold-tone bracelet with a butterfly clasp.',
   '34 mm', '316L stainless steel, gold PVD', 'Stainless steel bracelet, gold-tone', 'Japanese quartz', 'Sapphire-coated mineral', '3 ATM', '76 g'),
  (17, 'seraph-pearl', 'Seraph Pearl', 'chain', 'women', 5490, null, 3, '{new}', false, false,
   'A mother-of-pearl effect dial on a slim rose-gold bracelet.',
   '33 mm', '316L stainless steel, rose gold PVD', 'Stainless steel bracelet, rose-tone', 'Japanese quartz', 'Sapphire-coated mineral', '3 ATM', '70 g'),
  (18, 'kairos-automatic', 'Kairos Automatic', 'automatic-skeleton', 'men', 14900, 16900, 4, '{limited}', true, false,
   'An octagonal-bezel automatic with an open-worked dial and exhibition caseback.',
   '42 mm', '316L stainless steel', 'Rubber, black', 'Japanese automatic (Seiko NH35)', 'Sapphire crystal', '10 ATM', '138 g'),
  (19, 'monarch-skeleton', 'Monarch Skeleton', 'automatic-skeleton', 'men', 12490, null, 5, '{new}', true, false,
   'A full skeleton dial that shows the balance wheel at work.',
   '43 mm', '316L stainless steel, gunmetal IP', 'Genuine leather, black', 'Japanese automatic (Seiko NH70)', 'Sapphire crystal', '5 ATM', '96 g'),
  (20, 'obsidian-gmt', 'Obsidian GMT', 'automatic-skeleton', 'men', 16500, null, 3, '{limited}', false, false,
   'A dual-time automatic with a 24-hour bezel for a second time zone.',
   '41 mm', '316L stainless steel', 'Stainless steel bracelet', 'Japanese automatic GMT (Seiko NH34)', 'Sapphire crystal', '10 ATM', '152 g'),
  (21, 'halcyon-automatic', 'Halcyon Automatic', 'automatic-skeleton', 'unisex', 11900, null, 6, '{}', false, false,
   'A quiet ivory dial automatic with an open heart at six.',
   '38 mm', '316L stainless steel', 'Genuine leather, blue', 'Japanese automatic (Seiko NH38)', 'Sapphire crystal', '5 ATM', '78 g'),
  (22, 'duet-classic-pair', 'Duet Classic Pair', 'couple', 'unisex', 7990, 9490, 8, '{sale}', true, true,
   'His 40 mm and her 32 mm, matched white dials, boxed together.',
   '40 mm / 32 mm', '316L stainless steel, rose gold PVD', 'Genuine leather', 'Japanese quartz', 'Mineral crystal', '3 ATM', '64 g / 40 g'),
  (23, 'union-steel-pair', 'Union Steel Pair', 'couple', 'unisex', 11490, null, 5, '{}', false, false,
   'Two steel bracelet watches, sized for each wrist, in one pair box.',
   '41 mm / 34 mm', '316L stainless steel', 'Stainless steel bracelet', 'Japanese quartz', 'Sapphire-coated mineral', '5 ATM', '134 g / 76 g'),
  (24, 'equinox-pair', 'Equinox Pair', 'couple', 'unisex', 6490, null, 10, '{new}', false, false,
   'Blue sunburst dials in gold-tone cases, made to be worn together.',
   '42 mm / 34 mm', '316L stainless steel, gold PVD', 'Genuine leather, navy', 'Japanese quartz', 'Sapphire-coated mineral', '3 ATM', '74 g / 50 g')
) as d (ord, slug, name, cat, gender, price, compare_at, stock, badges, featured, bestseller,
        short_desc, case_size, case_material, strap, movement, glass, wr, weight);

-- Images: one studio shot + one lifestyle (on-wrist / in-hand) shot per product.
insert into public.product_images (product_id, url, alt, is_lifestyle, sort_order)
select p.id, pg_temp.img(i.photo), p.name || i.alt_suffix, i.lifestyle, i.sort
from (values
  ('meridian-classic',    '1612817159949-195b6eb9e31a', ', front', false, 0),
  ('meridian-classic',    '1533139502658-0198f920d8e8', ', outdoors', true, 1),
  ('atlas-chronograph',   '1542496658-e33a6d0d50f6', ', front', false, 0),
  ('atlas-chronograph',   '1539874754764-5a96559165b0', ', angle', false, 1),
  ('atlas-chronograph',   '1495856458515-0637185db551', ', outdoors', true, 2),
  ('regent-blue',         '1619134778706-7015533a6150', ', front', false, 0),
  ('regent-blue',         '1533139502658-0198f920d8e8', ', outdoors', true, 1),
  ('corsa-chronograph',   '1539874754764-5a96559165b0', ', front', false, 0),
  ('corsa-chronograph',   '1495856458515-0637185db551', ', outdoors', true, 1),
  ('tempo-field',         '1585123334904-845d60e97b29', ', front', false, 0),
  ('tempo-field',         '1524592094714-0f0654e20314', ', in hand', true, 1),
  ('celeste-rose',        '1524592094714-0f0654e20314', ', in hand', false, 0),
  ('celeste-rose',        '1522312346375-d1a52e2b99b3', ', lifestyle', true, 1),
  ('aria-chronograph',    '1522312346375-d1a52e2b99b3', ', front', false, 0),
  ('aria-chronograph',    '1524592094714-0f0654e20314', ', in hand', true, 1),
  ('vela-petite',         '1585123334904-845d60e97b29', ', front', false, 0),
  ('vela-petite',         '1524592094714-0f0654e20314', ', in hand', true, 1),
  ('sterling-diver',      '1594534475808-b18fc33b045e', ', front', false, 0),
  ('sterling-diver',      '1533139502658-0198f920d8e8', ', outdoors', true, 1),
  ('orion-explorer',      '1587836374828-4dbafa94cf0e', ', front', false, 0),
  ('orion-explorer',      '1495856458515-0637185db551', ', outdoors', true, 1),
  ('abyss-deep',          '1611591437281-460bfbe1220a', ', front', false, 0),
  ('abyss-deep',          '1533139502658-0198f920d8e8', ', outdoors', true, 1),
  ('nautica-chronograph', '1548171915-e79a380a2a4b', ', front', false, 0),
  ('nautica-chronograph', '1495856458515-0637185db551', ', outdoors', true, 1),
  ('monarch-steel',       '1547996160-81dfa63595aa', ', front', false, 0),
  ('monarch-steel',       '1587836374828-4dbafa94cf0e', ', angle', false, 1),
  ('monarch-steel',       '1533139502658-0198f920d8e8', ', outdoors', true, 2),
  ('ember-chronograph',   '1622434641406-a158123450f9', ', front', false, 0),
  ('ember-chronograph',   '1495856458515-0637185db551', ', outdoors', true, 1),
  ('noctis-minimal',      '1434056886845-dac89ffe9b56', ', front', false, 0),
  ('noctis-minimal',      '1533139502658-0198f920d8e8', ', outdoors', true, 1),
  ('lumen-gold',          '1619134778706-7015533a6150', ', front', false, 0),
  ('lumen-gold',          '1524592094714-0f0654e20314', ', in hand', true, 1),
  ('seraph-pearl',        '1522312346375-d1a52e2b99b3', ', front', false, 0),
  ('seraph-pearl',        '1524592094714-0f0654e20314', ', in hand', true, 1),
  ('kairos-automatic',    '1609587312208-cea54be969e7', ', front', false, 0),
  ('kairos-automatic',    '1614164185128-e4ec99c436d7', ', detail', false, 1),
  ('kairos-automatic',    '1495856458515-0637185db551', ', outdoors', true, 2),
  ('monarch-skeleton',    '1614164185128-e4ec99c436d7', ', front', false, 0),
  ('monarch-skeleton',    '1533139502658-0198f920d8e8', ', outdoors', true, 1),
  ('obsidian-gmt',        '1548171915-e79a380a2a4b', ', front', false, 0),
  ('obsidian-gmt',        '1495856458515-0637185db551', ', outdoors', true, 1),
  ('halcyon-automatic',   '1585123334904-845d60e97b29', ', front', false, 0),
  ('halcyon-automatic',   '1524592094714-0f0654e20314', ', in hand', true, 1),
  ('duet-classic-pair',   '1524592094714-0f0654e20314', ', front', false, 0),
  ('duet-classic-pair',   '1522312346375-d1a52e2b99b3', ', lifestyle', true, 1),
  ('union-steel-pair',    '1547996160-81dfa63595aa', ', front', false, 0),
  ('union-steel-pair',    '1594534475808-b18fc33b045e', ', detail', false, 1),
  ('union-steel-pair',    '1533139502658-0198f920d8e8', ', outdoors', true, 2),
  ('equinox-pair',        '1619134778706-7015533a6150', ', front', false, 0),
  ('equinox-pair',        '1495856458515-0637185db551', ', outdoors', true, 1)
) as i (slug, photo, alt_suffix, lifestyle, sort)
join public.products p on p.slug = i.slug;

-- Variants. For these products the variant rows hold the stock; products.stock is
-- kept equal to their sum so listings can show availability without a join.
insert into public.product_variants (product_id, name, sku, price_override, stock, swatch_hex, image_id, sort_order)
select p.id, v.name, v.sku, v.price_override, v.stock, v.swatch,
       (select pi.id from public.product_images pi
        where pi.product_id = p.id and pi.sort_order = v.image_sort), v.sort
from (values
  ('tempo-field',   'Sky blue strap', 'HX-005-BL', null::int, 7, '#7FA7C9', 0, 0),
  ('tempo-field',   'Tan strap',      'HX-005-TN', null,      5, '#B07A4A', 0, 1),
  ('tempo-field',   'Black strap',    'HX-005-BK', null,      0, '#1A1A1A', 0, 2),
  ('celeste-rose',  'Taupe strap',    'HX-006-TP', null,      9, '#8C7B6B', 0, 0),
  ('celeste-rose',  'Black strap',    'HX-006-BK', null,      4, '#1A1A1A', 1, 1),
  ('monarch-steel', 'Silver dial',    'HX-013-SV', null,      6, '#C9CCD1', 0, 0),
  ('monarch-steel', 'Black dial',     'HX-013-BK', 6790,      4, '#141414', 1, 1)
) as v (slug, name, sku, price_override, stock, swatch, image_sort, sort)
join public.products p on p.slug = v.slug;

update public.products p
set stock = (select sum(v.stock) from public.product_variants v where v.product_id = p.id)
where exists (select 1 from public.product_variants v where v.product_id = p.id);

-- ---------------------------------------------------------------------------
-- Collections: one hand-picked, one rule-based (rules are read by the storefront).
-- ---------------------------------------------------------------------------
insert into public.collections (slug, title, description, banner, mode, rules, sort_order) values
  ('gift-edit', 'The Gift Edit', 'Boxed and ready to give: pairs, rose gold and our most-loved dials.',
    pg_temp.img('1524592094714-0f0654e20314', 1600, 900), 'manual', '{}', 1),
  ('under-2999', 'Under ৳2,999', 'Everyday watches at an easy price.',
    pg_temp.img('1434056886845-dac89ffe9b56', 1600, 900), 'rules', '{"price_max": 2999}', 2);

insert into public.collection_products (collection_id, product_id, sort_order)
select c.id, p.id, x.sort
from (values
  ('duet-classic-pair', 0), ('celeste-rose', 1), ('equinox-pair', 2),
  ('lumen-gold', 3), ('meridian-classic', 4), ('union-steel-pair', 5)
) as x (slug, sort)
join public.products p on p.slug = x.slug
cross join public.collections c
where c.slug = 'gift-edit';

-- ---------------------------------------------------------------------------
-- Reviews (approved) — sample text, replace with real customer reviews.
-- ---------------------------------------------------------------------------
insert into public.reviews (product_id, name, rating, text, status, created_at)
select p.id, r.name, r.rating, r.text, 'approved', now() - make_interval(days => r.days_ago)
from (values
  ('meridian-classic', 'Tanvir H.', 5, 'Looks even better in person. Checked it at the door, paid, done.', 12),
  ('meridian-classic', 'Rafiq A.', 4, 'Clean dial, comfortable strap. Delivery to Mirpur took one day.', 30),
  ('sterling-diver', 'Sabbir R.', 5, 'Heavy, solid bracelet. Box and warranty card were all there.', 8),
  ('sterling-diver', 'Imran K.', 5, 'They called to confirm within an hour. Very smooth.', 41),
  ('celeste-rose', 'Nusrat J.', 5, 'Bought it as a gift for my sister. The packaging is lovely.', 5),
  ('celeste-rose', 'Farhana T.', 4, 'Slim and light. The strap is a little stiff at first.', 22),
  ('duet-classic-pair', 'Arif & Mim', 5, 'Our anniversary gift to each other. Both fit perfectly.', 16),
  ('kairos-automatic', 'Shahriar M.', 5, 'The movement through the caseback is the best part.', 19),
  ('noctis-minimal', 'Mehedi H.', 4, 'Great value. Minimal and goes with everything.', 27),
  ('atlas-chronograph', 'Rakib U.', 5, 'All the chronograph pushers work, and it looks sharp.', 34),
  ('tempo-field', 'Sadia I.', 5, 'Ordered the blue strap. Exactly like the photos.', 9),
  ('lumen-gold', 'Tasnim A.', 4, 'Pretty and not too flashy. Delivered to Chattogram in 3 days.', 14)
) as r (slug, name, rating, text, days_ago)
join public.products p on p.slug = r.slug;

-- ---------------------------------------------------------------------------
-- Delivery zones (roadmap §6.7) and settings
-- ---------------------------------------------------------------------------
insert into public.delivery_zones (name, charge, eta_text, sort_order) values
  ('Inside Dhaka', 70, '1–2 days', 1),
  ('Dhaka Sub-area', 100, '2–3 days', 2),
  ('Outside Dhaka', 130, '2–4 days', 3);

-- announcements: [{ text, link? }]
update public.site_settings set
  brand_name = 'HORVEX',
  announcements = '[
    {"text": "Free delivery on orders over ৳4,999"},
    {"text": "Cash on Delivery all over Bangladesh"},
    {"text": "7-Day Replacement", "link": "/policy/returns-replacement"}
  ]'::jsonb,
  footer_text = 'Premium watches, quality-checked in Dhaka and delivered to all 64 districts. Check before you pay.',
  free_delivery_threshold = 5000,
  seo_title = 'HORVEX — Premium Watches in Bangladesh',
  seo_desc = 'Shop premium men''s, women''s and couple watches. Cash on Delivery, check before you pay, 7-day replacement, delivery all over Bangladesh.'
where id;

-- Sample coupon, inactive until the owner turns it on in Admin → Coupons.
insert into public.coupons (code, type, value, min_order, is_active)
values ('WELCOME10', 'percent', 10, 3000, false);

-- ---------------------------------------------------------------------------
-- Homepage (roadmap §6.1). The announcement bar and header aren't sections:
-- they come from site_settings and the layout. config shapes are the contract
-- the B-phase sections read.
-- ---------------------------------------------------------------------------
insert into public.home_sections (key, title, subtitle, config, sort_order) values
  ('hero', null, null, '{"max_slides": 3}', 1),
  ('trust_marquee', null, null,
    '{"items": ["Cash on Delivery", "Check Before You Pay", "7-Day Replacement", "64-District Delivery", "Quality Checked"]}', 2),
  ('categories', 'Shop by Category', null,
    '{"slugs": ["men", "women", "couple", "automatic-skeleton", "leather"]}', 3),
  ('featured', 'The Collection', 'Chosen by our customers, and by us.',
    '{"limit": 8, "tabs": [
       {"key": "bestsellers", "label": "Best Sellers"},
       {"key": "new", "label": "New Arrivals"},
       {"key": "sale", "label": "On Sale"}]}', 4),
  ('anatomy', 'Anatomy of a HORVEX', 'What you are paying for, part by part.',
    '{"callouts": [
       {"key": "crystal", "title": "Crystal", "text": "Sapphire-coated mineral glass that shrugs off everyday scratches."},
       {"key": "case", "title": "Case", "text": "316L stainless steel, the same grade used in surgical tools."},
       {"key": "movement", "title": "Movement", "text": "Japanese quartz or automatic movements, tested before they ship."},
       {"key": "water", "title": "Water resistance", "text": "3 to 10 ATM. Rain, handwashing and splashes are fine."}]}', 5),
  ('him_her', null, null,
    '{"him": {"title": "Shop for Him", "link": "/category/men", "image": "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1200&h=1500&q=80"},
      "her": {"title": "Shop for Her", "link": "/category/women", "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&h=1500&q=80"},
      "products_per_side": 4}', 6),
  ('brand_film', 'Made to be looked at', 'Every HORVEX is checked by hand in Dhaka before it reaches you.',
    '{"video_url": null, "poster": "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=2560&h=1440&q=80",
      "cta_label": "Our story", "cta_link": "/about"}', 7),
  ('promo', null, null, '{"placement": "home_promo"}', 8),
  ('how_to_order', 'How to Order', 'Cash on Delivery, the simple way.',
    '{"steps": [
       {"title": "Order", "text": "Place your order in about 30 seconds. No account needed."},
       {"title": "We call to confirm", "text": "Our team calls you within a few hours to confirm the details."},
       {"title": "Check and pay", "text": "Open the box, check your watch, then pay the rider."}]}', 9),
  ('reviews', 'From Our Customers', null, '{"limit": 8}', 10),
  -- Hidden until real post links are added in Admin → Homepage.
  ('social_grid', 'Follow HORVEX', null, '{"posts": []}', 11),
  ('newsletter', 'Join the Circle', 'Early access to new drops and members-only offers, on WhatsApp or email.',
    '{"image": "https://images.unsplash.com/photo-1495856458515-0637185db551?auto=format&fit=crop&w=2560&h=1440&q=80"}', 12),
  ('faq', 'Questions, Answered', null, '{"limit": 6}', 13);
update public.home_sections set is_visible = false where key = 'social_grid';

insert into public.hero_slides (eyebrow, title, subtitle, cta_label, cta_link, image_desktop, image_mobile, sort_order) values
  ('HORVEX · NEW COLLECTION', 'Time, *Refined.*', 'Premium watches, checked by hand and paid for at your door.',
    'Shop the Collection', '/shop',
    pg_temp.img('1614164185128-e4ec99c436d7', 2560, 1440), pg_temp.img('1614164185128-e4ec99c436d7', 1080, 1350), 1),
  ('AUTOMATIC & SKELETON', 'Watch it *work.*', 'Self-winding movements with open dials and exhibition casebacks.',
    'Explore Automatics', '/category/automatic-skeleton',
    pg_temp.img('1609587312208-cea54be969e7', 2560, 1440), pg_temp.img('1609587312208-cea54be969e7', 1080, 1350), 2),
  ('FOR TWO', 'Matched *pairs.*', 'His and hers, boxed together. The gift that keeps time.',
    'Shop Couple Watches', '/category/couple',
    pg_temp.img('1619134778706-7015533a6150', 2560, 1440), pg_temp.img('1619134778706-7015533a6150', 1080, 1350), 3);

insert into public.banners (placement, title, subtitle, image, image_mobile, link, countdown_to, sort_order) values
  ('home_promo', 'The Gift Edit', 'Up to 16% off pairs and rose gold. Ends soon.',
    pg_temp.img('1524592094714-0f0654e20314', 1600, 900), pg_temp.img('1524592094714-0f0654e20314', 1080, 1080),
    '/collection/gift-edit', now() + interval '14 days', 1);

-- ---------------------------------------------------------------------------
-- FAQs, testimonials, pages (draft copy for the client to review)
-- ---------------------------------------------------------------------------
insert into public.faqs (question, answer, topic, sort_order) values
  ('How does Cash on Delivery work?',
   'Place your order online and we call you to confirm it. When the rider arrives, open the box, check the watch, then pay in cash.', 'Ordering', 1),
  ('Can I check the watch before I pay?',
   'Yes. Open the parcel in front of the rider and check the watch. If anything is wrong, return it to the rider and pay only the delivery charge.', 'Ordering', 2),
  ('How long does delivery take?',
   'Inside Dhaka 1–2 days, Dhaka sub-areas 2–3 days, and outside Dhaka 2–4 days after we confirm your order.', 'Delivery', 3),
  ('How much is delivery?',
   'Inside Dhaka ৳70, Dhaka sub-areas ৳100, outside Dhaka ৳130. Delivery is free on orders over ৳4,999.', 'Delivery', 4),
  ('Is there a warranty?',
   'Quartz watches carry a 1-year movement warranty and automatics a 2-year movement warranty. Keep the warranty card that comes in the box.', 'Warranty', 5),
  ('What is the 7-day replacement policy?',
   'If your watch has a manufacturing fault, tell us within 7 days of delivery and we will replace it. The watch should be unworn, with its box and tags.', 'Returns', 6),
  ('Does the watch come with a box?',
   'Every HORVEX arrives in a gift box with a warranty card and a care guide.', 'Product', 7),
  ('How do I track my order?',
   'Go to Track Order and enter your phone number and order number (it starts with HVX-).', 'Delivery', 8);

insert into public.testimonials (name, location, text, rating, sort_order) values
  ('Tanvir Hasan', 'Mirpur, Dhaka', 'Checked the watch at my door before paying. That alone made me trust them.', 5, 1),
  ('Nusrat Jahan', 'Chattogram', 'Arrived in 3 days, beautifully boxed. My husband loved it.', 5, 2),
  ('Sabbir Rahman', 'Uttara, Dhaka', 'They called within an hour to confirm. Smooth from start to finish.', 5, 3),
  ('Farhana Tabassum', 'Sylhet', 'Elegant and light. Exactly like the photos.', 4, 4),
  ('Shahriar Mahmud', 'Dhanmondi, Dhaka', 'My first automatic. The finishing is far better than the price suggests.', 5, 5),
  ('Mim Akter', 'Rajshahi', 'Bought the couple set for our anniversary. Both fit perfectly.', 5, 6);

insert into public.pages (slug, title, content, seo_desc) values
  ('about', 'About HORVEX',
   'HORVEX began with a simple idea: a well-made watch should not be a gamble. Every piece we sell is checked by hand in Dhaka before it ships, and you pay only after you have seen it.

We choose stainless steel cases, sapphire-coated crystals and reliable Japanese movements, and we stand behind them with a written warranty and a 7-day replacement promise.',
   'The story behind HORVEX: premium watches, checked by hand and paid for at your door.'),
  ('shipping', 'Shipping Policy',
   'We deliver to all 64 districts of Bangladesh.

- Inside Dhaka: ৳70, 1–2 days
- Dhaka sub-areas: ৳100, 2–3 days
- Outside Dhaka: ৳130, 2–4 days

Delivery is free on orders over ৳4,999. Times start once we have confirmed your order by phone.',
   'Delivery charges and times for HORVEX orders across Bangladesh.'),
  ('returns-replacement', 'Returns & Replacement',
   'Check your watch in front of the rider before paying. If it is not right, return it on the spot and pay only the delivery charge.

After delivery, you have 7 days to request a replacement for a manufacturing fault. The watch must be unworn, with its original box, tags and warranty card. Contact us with your order number to start a replacement.',
   'How returns and the 7-day replacement work at HORVEX.'),
  ('warranty', 'Warranty',
   'Quartz watches carry a 1-year movement warranty; automatic watches carry a 2-year movement warranty, from the delivery date.

The warranty covers the movement. It does not cover the strap, crystal, battery, water damage beyond the rated resistance, or damage from drops and misuse. Keep your warranty card and order number.',
   'What the HORVEX watch warranty covers.'),
  ('privacy', 'Privacy Policy',
   'We collect the details you enter at checkout (name, phone, address and, if given, email) to deliver your order and contact you about it. We do not sell your information.

Our site uses analytics to understand how it is used. You can ask us to delete your details at any time by contacting us.',
   'How HORVEX handles your personal information.'),
  ('terms', 'Terms & Conditions',
   'Prices are in Bangladeshi taka and include VAT where applicable. An order is accepted once we confirm it by phone. We may cancel orders we cannot confirm or that appear fraudulent.

Product photos are for illustration; small differences in colour may occur.',
   'Terms for buying from HORVEX.');
