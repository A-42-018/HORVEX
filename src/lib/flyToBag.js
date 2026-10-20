import { DURATION, EASE, MOTION, clamp, prefersReducedMotion, toCubicBezier } from "./motion";
import { responsiveImage } from "./images";

// Fly-to-bag (roadmap §7 #9): a round thumbnail arcs from the element that was
// clicked to the visible bag icon (`[data-bag-target]`: header bag on lg+, tab
// bar bag below), then the bag's counter (`[data-bag-count]`) bounces.
// Web Animations API, transform + opacity only, pointer-events none. Resolves
// when done; resolves at once (no clone) under reduced motion or when no bag
// icon is on screen (e.g. the desktop header is hidden after scrolling down).

const ARC_LIFT = 120; // px the arc rises above its higher end
const STEPS = 12;

function visibleBag() {
  for (const el of document.querySelectorAll("[data-bag-target]")) {
    const r = el.getBoundingClientRect();
    const onScreen = r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
    if (onScreen) return el;
  }
  return null;
}

function bounce(bag) {
  const node = bag.querySelector("[data-bag-count]") ?? bag;
  node.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(0.92)" }, { transform: "scale(1)" }],
    { duration: DURATION.slow, easing: toCubicBezier(EASE.outExpo) },
  );
}

/** `from`: element to start at; `imageUrl`: fallback when it holds no loaded <img>. */
export function flyToBag(from, imageUrl) {
  if (!from || prefersReducedMotion() || typeof Element.prototype.animate !== "function") return Promise.resolve();
  const bag = visibleBag();
  const src = from.querySelector("img")?.currentSrc || responsiveImage(imageUrl, { aspect: [1, 1], widths: [160] }).src;
  if (!bag || !src) return Promise.resolve();

  const size = MOTION.flySize;
  const a = from.getBoundingClientRect();
  const b = bag.getBoundingClientRect();
  const x0 = a.left + a.width / 2 - size / 2;
  const y0 = a.top + a.height / 2 - size / 2;
  const x1 = b.left + b.width / 2 - size / 2;
  const y1 = b.top + b.height / 2 - size / 2;
  // Quadratic Bézier with its control point above both ends: a gentle arc.
  const cx = (x0 + x1) / 2;
  const cy = Math.min(y0, y1) - ARC_LIFT;
  const startScale = clamp(Math.min(a.width, a.height) / size, 0.6, 2.5);

  const frames = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
    const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    const scale = startScale + (0.3 - startScale) * t;
    return { transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`, opacity: t < 0.8 ? 1 : 0.4 };
  });

  const clone = document.createElement("img");
  clone.src = src;
  clone.alt = "";
  clone.setAttribute("aria-hidden", "true");
  clone.className = "pointer-events-none fixed left-0 top-0 z-[60] h-16 w-16 rounded-full border border-gold object-cover";
  document.body.append(clone);

  const flight = clone.animate(frames, {
    duration: MOTION.flyDuration,
    easing: toCubicBezier(EASE.inOutCubic),
    fill: "forwards",
  });
  return flight.finished.then(
    () => {
      clone.remove();
      bounce(bag);
    },
    () => clone.remove(),
  );
}
