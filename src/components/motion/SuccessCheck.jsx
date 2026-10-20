import { Check } from "lucide-react";
import { DURATION } from "../../lib/motion";

// Order success mark (roadmap §7 #15): the gold ring draws itself, then the
// check pops in. Plays once on mount; under reduced motion both are static.
function SuccessCheck() {
  return (
    <span className="relative flex h-20 w-20 items-center justify-center text-gold">
      <svg viewBox="0 0 80 80" aria-hidden="true" focusable="false" className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r="39"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          pathLength="1"
          strokeDasharray="1"
          className="motion-safe:animate-stroke-draw"
        />
      </svg>
      <Check
        size={36}
        strokeWidth={1.5}
        aria-hidden="true"
        className="motion-safe:animate-check-pop"
        style={{ animationDelay: `${DURATION.reveal - 100}ms` }}
      />
    </span>
  );
}

export default SuccessCheck;
