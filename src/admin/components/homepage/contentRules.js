// Pure rules for hero slides and promo banners (roadmap §10, B27b).
import { isoToLocal, localToIso } from "../collections/collectionForm";

export { isoToLocal, localToIso };
export { dragRow, moveRow } from "./homeSections";

// The storefront promo section shows at most two banners (PromoBanner MAX_BANNERS)
// and the roadmap caps the hero slider at three slides.
export const MAX_HERO_ACTIVE = 3;
export const MAX_PROMO_SHOWN = 2;

export const text = (value) => (value == null ? "" : String(value));
export const orNull = (value) => (value.trim() === "" ? null : value.trim());

/** A site path ("/shop") or a full http(s) URL. */
export function isValidLink(value) {
  const link = value.trim();
  if (!link) return false;
  if (/\s/.test(link)) return false;
  if (link.startsWith("/")) return !link.startsWith("//");
  try {
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Number of `*` characters is even (the storefront italicises *starred* words). */
export const starsBalanced = (value) => (value.match(/\*/g)?.length ?? 0) % 2 === 0;

/** Only the columns that differ from the loaded row (keeps the activity-log diff small). */
export const changedColumns = (payload, original) =>
  Object.fromEntries(Object.entries(payload).filter(([key, value]) => (original?.[key] ?? null) !== value));

const time = (iso) => (iso ? Date.parse(iso) : null);

/** hidden | scheduled | ended | live: what the storefront does with a hero slide right now. */
export function heroState(row, now = Date.now()) {
  if (!row.is_active) return "hidden";
  const from = time(row.active_from);
  const to = time(row.active_to);
  if (from != null && from > now) return "scheduled";
  if (to != null && to <= now) return "ended";
  return "live";
}

/** Active slides that count toward the cap (an ended slide no longer shows, so it doesn't). */
export const heroActiveCount = (rows, now = Date.now(), exceptId = null) =>
  rows.filter((row) => row.id !== exceptId && row.is_active && heroState(row, now) !== "ended").length;

export const canActivateHero = (rows, row, now = Date.now()) => heroActiveCount(rows, now, row?.id ?? null) < MAX_HERO_ACTIVE;

/** hidden | ended | live for a promo banner (a passed countdown hides it on the store). */
export function promoState(row, now = Date.now()) {
  if (!row.is_active) return "hidden";
  const end = time(row.countdown_to);
  if (end != null && end <= now) return "ended";
  return "live";
}

/** Ids of the banners the storefront actually shows: the first live ones, in order. */
export const promoShownIds = (rows, now = Date.now()) =>
  new Set(rows.filter((row) => promoState(row, now) === "live").slice(0, MAX_PROMO_SHOWN).map((row) => row.id));
