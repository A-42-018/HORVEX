// Motion tokens (roadmap §7). Single source of truth: tailwind.config.js builds
// the duration-*/ease-* utilities from these, and `motion` components import
// them directly so CSS and JS animations share the same timing.

// Milliseconds.
export const DURATION = {
  fast: 150, // hover / press
  base: 250, // UI state changes, route transition
  slow: 450, // drawers / modals
  reveal: 700, // scroll reveals
};

// Cubic-bezier control points, usable as `ease` in motion transitions.
export const EASE = {
  outExpo: [0.22, 1, 0.36, 1], // default
  inOutCubic: [0.65, 0, 0.35, 1], // page transitions
};

export const toCubicBezier = (points) => `cubic-bezier(${points.join(", ")})`;

// Signature motion (roadmap §7, C1). C2 builds on these too.
export const MOTION = {
  stagger: 80, // ms between headline lines
  gridStagger: 60, // ms between grid items (cap below)
  gridStaggerCap: 6,
  parallaxSpeed: 0.85, // image moves at 0.85× scroll speed
  parallaxBleed: 0.15, // extra image height per side, as a share of the frame
  bezelDegPerPx: 0.04, // hero bezel ring rotation per scrolled px
  magneticMax: 6, // px a magnetic CTA follows the cursor
  sweepEvery: 6000, // light sweep period
  preloaderTicks: 60, // ticks fill in ≤ 1.2s (one every ~15ms)
  preloaderTickStep: 15,
  // C2
  flyDuration: 650, // fly-to-bag arc
  flySize: 64, // px, the flying thumbnail
  heartParticles: 6,
  counterStagger: 90, // ms between rolling digits
  anatomyPinVh: 220, // pinned anatomy section height (vh) on desktop
};

// Media queries the motion layer keys off. Lenis needs a fine pointer; parallax
// and magnetic effects are desktop only.
export const MEDIA = {
  reducedMotion: "(prefers-reduced-motion: reduce)",
  finePointer: "(hover: hover) and (pointer: fine)",
  desktopPointer: "(min-width: 1024px) and (hover: hover) and (pointer: fine)",
  // Pinned scroll stories need room: a short laptop screen gets the static layout.
  pinned: "(min-width: 1024px) and (min-height: 700px) and (hover: hover) and (pointer: fine)",
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia(MEDIA.reducedMotion).matches;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Delay for the i-th item of a staggered group, capped so long lists don't drag.
export const staggerDelay = (index, step = MOTION.gridStagger, cap = MOTION.gridStaggerCap) =>
  Math.min(index, cap - 1) * step;

// One passive scroll listener shared by every scroll-linked effect (parallax,
// bezel ring, C2's pinned sections). Subscribers run at most once per frame with
// window.scrollY (Lenis scrolls the window too, so they see its smoothed position).
const scrollSubscribers = new Set();
let scrollFrame = 0;

const flushScroll = () => {
  scrollFrame = 0;
  const y = window.scrollY;
  scrollSubscribers.forEach((callback) => callback(y));
};
const scheduleScroll = () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(flushScroll);
};

export function subscribeScroll(callback) {
  if (!scrollSubscribers.size) {
    window.addEventListener("scroll", scheduleScroll, { passive: true });
    window.addEventListener("resize", scheduleScroll);
  }
  scrollSubscribers.add(callback);
  scheduleScroll();
  return () => {
    scrollSubscribers.delete(callback);
    if (scrollSubscribers.size) return;
    window.removeEventListener("scroll", scheduleScroll);
    window.removeEventListener("resize", scheduleScroll);
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
  };
}

/** Re-run every subscriber on the next frame (e.g. after a layout change). */
export const refreshScroll = scheduleScroll;
