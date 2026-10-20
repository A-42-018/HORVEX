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

// Hero slides (B6). Mobile widths include 828 / 1242 so 2x and 3x phones
// (~390–430px wide) get a close match instead of the next size up.
const HERO_DESKTOP_WIDTHS = [1080, 1600, 2560];
const HERO_MOBILE_WIDTHS = [480, 640, 828, 1080, 1242];

/**
 * { desktop, mobile } sources for a hero slide. Shared by the hero, its LCP
 * preload and scripts/prerender.mjs (which preloads slide 1 in the home HTML),
 * so all three request the same URLs.
 */
export function heroSources(slide) {
  return {
    desktop: responsiveImage(slide.image_desktop, { aspect: [16, 9], widths: HERO_DESKTOP_WIDTHS }),
    mobile: responsiveImage(slide.image_mobile || slide.image_desktop, {
      aspect: slide.image_mobile ? [4, 5] : [16, 9],
      widths: HERO_MOBILE_WIDTHS,
    }),
  };
}

/** Viewport split used by the hero's <source media>, so each viewport preloads only the image it shows. */
export const heroPreloads = (slide) => {
  const { desktop, mobile } = heroSources(slide);
  return [
    { image: mobile, media: "(max-width: 1023px)" },
    { image: desktop, media: "(min-width: 1024px)" },
  ].filter((p) => p.image.src);
};
