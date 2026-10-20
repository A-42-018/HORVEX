import { useRef } from "react";
import { MOTION, clamp } from "../../lib/motion";
import { useDesktopMotion } from "../../hooks/useMotionPrefs";

// Magnetic CTA (roadmap §7 #12): on desktop the wrapped button drifts toward the
// mouse by at most `max` px and eases back on leave. Touch, pen and reduced
// motion get a plain wrapper. The wrapper moves, so the button keeps its own
// hover / press transforms.
function Magnetic({ children, max = MOTION.magneticMax, className = "" }) {
  const enabled = useDesktopMotion();
  const ref = useRef(null);
  const box = useRef(null);

  const move = (event) => {
    if (!enabled || event.pointerType !== "mouse") return;
    const node = ref.current;
    // Measured once per hover: the rect would include our own translate.
    box.current ??= node.getBoundingClientRect();
    const { left, top, width, height } = box.current;
    const x = clamp(((event.clientX - left) / width - 0.5) * 2, -1, 1) * max;
    const y = clamp(((event.clientY - top) / height - 0.5) * 2, -1, 1) * max;
    node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
  };

  const reset = () => {
    box.current = null;
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <span
      ref={ref}
      onPointerMove={move}
      onPointerLeave={reset}
      className={`inline-flex transition-transform duration-base ease-out-expo ${className}`}
    >
      {children}
    </span>
  );
}

export default Magnetic;
