import { query } from "./supabase";

// Homepage and editorial content. RLS returns only visible/active rows (and
// hero slides inside their date window), so no status filters here.

export function listHomeSections() {
  return query((db) =>
    db.from("home_sections").select("id, key, title, subtitle, config, sort_order").order("sort_order"),
  );
}

export function listHeroSlides() {
  return query((db) =>
    db
      .from("hero_slides")
      .select("id, eyebrow, title, subtitle, cta_label, cta_link, image_desktop, image_mobile, video_url, sort_order")
      .order("sort_order"),
  );
}

/** Active banners, optionally for one placement (e.g. "home_promo"). */
export function listBanners(placement) {
  return query((db) => {
    let q = db
      .from("banners")
      .select("id, placement, title, subtitle, image, image_mobile, link, countdown_to, sort_order")
      .order("sort_order");
    if (placement) q = q.eq("placement", placement);
    return q;
  });
}

export function listFaqs() {
  return query((db) => db.from("faqs").select("id, question, answer, topic, sort_order").order("sort_order"));
}

export function listTestimonials() {
  return query((db) =>
    db.from("testimonials").select("id, name, location, text, rating, photo_url, sort_order").order("sort_order"),
  );
}

/** Latest approved reviews across the store, with the product they're for. */
export function listRecentReviews(limit = 8) {
  return query((db) =>
    db
      .from("reviews")
      .select("id, name, rating, text, photo_url, created_at, product:products (slug, name)")
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

/** A published page (policies, about), or null. */
export function getPage(slug) {
  return query((db) =>
    db.from("pages").select("slug, title, content, seo_desc, updated_at").eq("slug", slug).maybeSingle(),
  );
}

// Inbound writes. Anon may insert but not read back, so never ask for the row
// (no `.select()`): `return=representation` would fail under RLS.

/** { phone?, email?, source } — phone already normalized to +880… */
export function subscribe({ phone = null, email = null, source }) {
  return query((db) => db.from("subscribers").insert({ phone, email, source }));
}

export function sendContactMessage({ name, phone = null, email = null, message }) {
  return query((db) => db.from("contact_messages").insert({ name, phone, email, message }));
}
