// URL slugs: lowercase a–z, 0–9 and single hyphens (same rule as the DB check).
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const isValidSlug = (value) => SLUG_PATTERN.test(value);

/** "Aurora Chrono – 42mm" → "aurora-chrono-42mm". */
export function slugify(text = "") {
  return String(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
