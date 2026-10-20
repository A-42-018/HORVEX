import { useState } from "react";
import { Heart } from "lucide-react";
import { MOTION } from "../../lib/motion";
import { useReducedMotion } from "../../hooks/useMotionPrefs";

const PARTICLES = Array.from({ length: MOTION.heartParticles }, (_, i) => (360 / MOTION.heartParticles) * i);

// Wishlist heart (roadmap §7 #10). When `active` turns on (not on mount), the
// heart pops and six gold particles burst outward. Under reduced motion it just
// fills. Decorative: the button around it carries the label and aria-pressed.
function HeartBurst({ active, size = 20, className = "" }) {
  const reduced = useReducedMotion();
  const [prev, setPrev] = useState(active);
  const [burst, setBurst] = useState(0);
  if (active !== prev) {
    setPrev(active);
    if (active) setBurst((n) => n + 1);
  }
  const play = burst > 0 && active && !reduced;

  return (
    <span className="relative inline-flex">
      <Heart
        key={`heart-${burst}`}
        aria-hidden="true"
        size={size}
        strokeWidth={1.5}
        fill={active ? "currentColor" : "none"}
        className={`${play ? "animate-heart-pop" : ""} ${className}`}
      />
      {play && (
        <span key={`burst-${burst}`} aria-hidden="true" className="pointer-events-none absolute inset-0">
          {PARTICLES.map((angle) => (
            <span
              key={angle}
              style={{ "--angle": `${angle}deg` }}
              className="absolute left-1/2 top-1/2 -ml-0.5 -mt-0.5 h-1 w-1 animate-heart-particle rounded-full bg-gold"
            />
          ))}
        </span>
      )}
    </span>
  );
}

export default HeartBurst;
