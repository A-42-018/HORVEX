import { useEffect, useRef } from "react";
import { MOTION, clamp, refreshScroll, subscribeScroll } from "../../lib/motion";
import { useDesktopMotion } from "../../hooks/useMotionPrefs";

// Scroll parallax for a background image (roadmap §7 #4), desktop only: the
// image moves at `speed`× scroll speed inside its frame. The moving layer is
// `bleed` taller on each side so it never shows an edge, and the shift is capped
// at that bleed. Elsewhere the children render as they are (no wrapper).
// The parent must be positioned; `className` lands on the frame (e.g. -z-20).
function Parallax({ children, speed = MOTION.parallaxSpeed, bleed = MOTION.parallaxBleed, className = "" }) {
  const enabled = useDesktopMotion();
  if (!enabled) return children;
  return (
    <ParallaxLayer speed={speed} bleed={bleed} className={className}>
      {children}
    </ParallaxLayer>
  );
}

function ParallaxLayer({ children, speed, bleed, className }) {
  const frameRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const frame = frameRef.current;
    const layer = layerRef.current;
    let box = { top: 0, height: 0 };
    // Page position of the frame; re-measured when it or the page resizes
    // (content loading above it moves it without resizing it).
    const measure = () => {
      const rect = frame.getBoundingClientRect();
      box = { top: rect.top + window.scrollY, height: rect.height };
      refreshScroll();
    };
    // Shift = (viewport centre − frame centre) × (1 − speed): zero when centred.
    const update = (scrollY) => {
      const viewport = window.innerHeight;
      const distance = scrollY + viewport / 2 - (box.top + box.height / 2);
      if (Math.abs(distance) > (viewport + box.height) / 2 + 100) return; // off screen
      const max = box.height * bleed;
      layer.style.transform = `translate3d(0, ${clamp(distance * (1 - speed), -max, max).toFixed(1)}px, 0)`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(document.body);
    const unsubscribe = subscribeScroll(update);
    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [speed, bleed]);

  return (
    <div ref={frameRef} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div ref={layerRef} style={{ top: `${-bleed * 100}%`, bottom: `${-bleed * 100}%` }} className="absolute inset-x-0">
        {children}
      </div>
    </div>
  );
}

export default Parallax;
