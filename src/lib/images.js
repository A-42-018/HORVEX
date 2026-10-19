// Responsive image helper (B5a). Unsplash-style URLs carry `w`/`h` params, so
// we rebuild them per width for a real srcset. Any other URL (e.g. Supabase
// Storage) is returned as-is, because nothing resizes those on the fly.
const CARD_WIDTHS = [320, 480, 640, 800, 1200];

/** Returns { src, srcSet? } for an image URL cropped to `aspect` ([w, h]). */
export function responsiveImage(url, { aspect = [4, 5], widths = CARD_WIDTHS } = {}) {
  if (!url) return { src: "" };
  try {
    const base = new URL(url);
    if (!base.searchParams.has("w")) return { src: url };
    const [aw, ah] = aspect;
    const at = (width) => {
      const next = new URL(base);
      next.searchParams.set("w", String(width));
      next.searchParams.set("h", String(Math.round((width * ah) / aw)));
      return next.toString();
    };
    return {
      src: at(widths[Math.floor(widths.length / 2)]),
      srcSet: widths.map((w) => `${at(w)} ${w}w`).join(", "),
    };
  } catch {
    return { src: url };
  }
}
