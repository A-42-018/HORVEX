import { useEffect, useRef } from "react";
import { MOTION, subscribeScroll } from "../../lib/motion";
import { useDesktopMotion } from "../../hooks/useMotionPrefs";

const TICKS = Array.from({ length: 60 }, (_, i) => i);

// SVG minute track (roadmap §7 #5). Rotates slowly with scroll on desktop;
// static under reduced motion. Decorative only. Size and place it with `className`.
function BezelRing({ className = "" }) {
  const enabled = useDesktopMotion();
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return undefined;
    const unsubscribe = subscribeScroll((y) => {
      node.style.transform = `rotate(${(y * MOTION.bezelDegPerPx).toFixed(2)}deg)`;
    });
    return () => {
      unsubscribe();
      node.style.transform = "";
    };
  }, [enabled]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      className={`pointer-events-none text-gold ${className}`}
    >
      <circle cx="100" cy="100" r="98" strokeWidth="0.4" />
      <circle cx="100" cy="100" r="86" strokeWidth="0.25" />
      {TICKS.map((i) => (
        <line
          key={i}
          x1="100"
          x2="100"
          y1={i % 5 === 0 ? 3 : 5}
          y2="12"
          strokeWidth={i % 15 === 0 ? 1.2 : i % 5 === 0 ? 0.8 : 0.35}
          transform={`rotate(${i * 6} 100 100)`}
        />
      ))}
    </svg>
  );
}

export default BezelRing;
