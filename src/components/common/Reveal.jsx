import { useInView } from "../../hooks/useInView";
import { DURATION } from "../../lib/motion";

// Initial (pre-reveal) transform per variant (fade-up = 16px, roadmap §7 #7). All variants end at
// translate-x-0 translate-y-0 opacity-100 — kept intentionally subtle
// per the roadmap's "fast, smooth, subtle, professional" direction.
const VARIANTS = {
  "fade-up": "translate-y-4 opacity-0",
  "fade-in": "opacity-0",
  "slide-left": "translate-x-6 opacity-0",
  "slide-right": "-translate-x-6 opacity-0",
};

/**
 * Wraps a section/block so it fades (and optionally slides) into place the
 * first time it scrolls into view, instead of animating on mount whether or
 * not it's visible. `delay` lets sibling items stagger (use `staggerDelay(i)`
 * from lib/motion: 60ms steps, capped at 6 items). Transitions collapse to ~instant under prefers-reduced-motion
 * via the global override in index.css, and `useInView` also skips the
 * initial hidden state entirely in that case.
 */
function Reveal({
  children,
  as: Component = "div",
  variant = "fade-up",
  delay = 0,
  duration = DURATION.reveal,
  className = "",
  ...props
}) {
  const [ref, inView] = useInView();

  return (
    <Component
      ref={ref}
      className={`transition-[transform,opacity] ease-out-expo ${
        inView ? "translate-x-0 translate-y-0 opacity-100" : VARIANTS[variant]
      } ${className}`}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: inView ? `${delay}ms` : "0ms" }}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Reveal;
