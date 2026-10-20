import { query } from "./adminClient";
import { pathFromPublicUrl, removeFiles } from "./storage";

// Admin hero slides and home promo banners (roadmap §10, Homepage builder).
// Inactive, scheduled and ended rows are visible to admins via RLS.
export const CONTENT_BUCKET = "site-media";
export const HERO_FOLDER = "hero";
export const PROMO_FOLDER = "banners";
export const PROMO_PLACEMENT = "home_promo";

const HERO_FIELDS =
  "id, eyebrow, title, subtitle, cta_label, cta_link, image_desktop, image_mobile, sort_order, is_active, active_from, active_to";
const PROMO_FIELDS = "id, placement, title, subtitle, image, image_mobile, link, countdown_to, sort_order, is_active";

export const listHeroRows = () =>
  query((db) => db.from("hero_slides").select(HERO_FIELDS).order("sort_order").order("created_at"));

export const listPromoRows = () =>
  query((db) =>
    db.from("banners").select(PROMO_FIELDS).eq("placement", PROMO_PLACEMENT).order("sort_order").order("created_at"),
  );

/** Largest sort_order + 1, so a new row lands last. */
export async function nextHeroSortOrder() {
  const rows = await query((db) =>
    db.from("hero_slides").select("sort_order").order("sort_order", { ascending: false }).limit(1),
  );
  return (rows[0]?.sort_order ?? -1) + 1;
}

export async function nextPromoSortOrder() {
  const rows = await query((db) =>
    db
      .from("banners")
      .select("sort_order")
      .eq("placement", PROMO_PLACEMENT)
      .order("sort_order", { ascending: false })
      .limit(1),
  );
  return (rows[0]?.sort_order ?? -1) + 1;
}

/** Best-effort delete of uploaded files (seed/external URLs have no path in our bucket). */
export async function removeContentImageFiles(urls) {
  const paths = urls.map((url) => pathFromPublicUrl(CONTENT_BUCKET, url)).filter(Boolean);
  if (paths.length) await removeFiles(CONTENT_BUCKET, paths).catch(() => {});
}
