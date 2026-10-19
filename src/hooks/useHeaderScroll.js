import { useEffect, useRef, useState } from "react";

const SOLID_AFTER = 80; // px scrolled before the header turns solid (roadmap §5.3)
const HIDE_AFTER = 240; // never hide while still near the top
const DELTA = 8; // ignore tiny scroll jitters

/**
 * Scroll state for the sticky header: `scrolled` once past SOLID_AFTER,
 * `hidden` while scrolling down and shown again on any scroll up.
 * rAF-throttled; setState bails out when nothing changed.
 */
export function useHeaderScroll() {
  const [state, setState] = useState({ scrolled: false, hidden: false });
  const lastY = useRef(0);

  useEffect(() => {
    let frame = 0;
    lastY.current = window.scrollY;

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const diff = y - lastY.current;
      let hidden;
      if (y < HIDE_AFTER) hidden = false;
      else if (diff > DELTA) hidden = true;
      else if (diff < -DELTA) hidden = false;
      if (Math.abs(diff) > DELTA || y < HIDE_AFTER) lastY.current = y;
      setState((prev) => {
        const next = { scrolled: y > SOLID_AFTER, hidden: hidden ?? prev.hidden };
        return next.scrolled === prev.scrolled && next.hidden === prev.hidden ? prev : next;
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return state;
}
