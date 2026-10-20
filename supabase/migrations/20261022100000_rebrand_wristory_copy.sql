-- Rebrand leftover seeded copy: HORVEX -> WRISTORY (tab title, home sections,
-- hero eyebrow, pages, product descriptions). Text only; order numbers keep HVX-.
-- Idempotent: rows without "HORVEX" are untouched.

begin;

update public.site_settings set
  seo_title   = replace(seo_title, 'HORVEX', 'WRISTORY'),
  seo_desc    = replace(seo_desc, 'HORVEX', 'WRISTORY'),
  footer_text = replace(footer_text, 'HORVEX', 'WRISTORY'),
  brand_name  = replace(brand_name, 'HORVEX', 'WRISTORY')
where concat_ws(' ', seo_title, seo_desc, footer_text, brand_name) ilike '%horvex%';

update public.home_sections set
  title    = replace(title, 'HORVEX', 'WRISTORY'),
  subtitle = replace(subtitle, 'HORVEX', 'WRISTORY')
where concat_ws(' ', title, subtitle) ilike '%horvex%';

update public.hero_slides set
  eyebrow  = replace(eyebrow, 'HORVEX', 'WRISTORY'),
  title    = replace(title, 'HORVEX', 'WRISTORY'),
  subtitle = replace(subtitle, 'HORVEX', 'WRISTORY')
where concat_ws(' ', eyebrow, title, subtitle) ilike '%horvex%';

update public.banners set
  title    = replace(title, 'HORVEX', 'WRISTORY'),
  subtitle = replace(subtitle, 'HORVEX', 'WRISTORY')
where concat_ws(' ', title, subtitle) ilike '%horvex%';

update public.pages set
  title    = replace(title, 'HORVEX', 'WRISTORY'),
  content  = replace(content, 'HORVEX', 'WRISTORY'),
  seo_desc = replace(seo_desc, 'HORVEX', 'WRISTORY')
where concat_ws(' ', title, content, seo_desc) ilike '%horvex%';

update public.products set
  short_desc  = replace(short_desc, 'HORVEX', 'WRISTORY'),
  description = replace(description, 'HORVEX', 'WRISTORY'),
  seo_title   = replace(seo_title, 'HORVEX', 'WRISTORY'),
  seo_desc    = replace(seo_desc, 'HORVEX', 'WRISTORY')
where concat_ws(' ', short_desc, description, seo_title, seo_desc) ilike '%horvex%';

update public.faqs set
  question = replace(question, 'HORVEX', 'WRISTORY'),
  answer   = replace(answer, 'HORVEX', 'WRISTORY')
where concat_ws(' ', question, answer) ilike '%horvex%';

commit;
