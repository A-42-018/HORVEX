import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";

/**
 * Tracks whether an element has scrolled into the viewport, once.
 * Used to drive the site's scroll-reveal animation system (Phase 17).
 *
 * - Fires once via IntersectionObserver, then disconnects (no re-hiding on scroll-up).
 * - If the user prefers reduced motion, `inView` starts (and stays) `true` so no
 *   observer is even attached — content just renders in its final state.
 */
export function useInView({ threshold = 0.15, rootMargin = "0px 0px -10% 0px" } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(prefersReducedMotion);

  useEffect(() => {
    if (inView) return; // already revealed (reduced motion, or fired before re-render)
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView];
}

export default useInView;
