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
