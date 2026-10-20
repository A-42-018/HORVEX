import { useEffect, useId, useRef } from "react";
import { Container, SectionHeading, Reveal } from "../common";
import { useHomeSections } from "../../hooks/useContent";
import { useInView } from "../../hooks/useInView";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useReducedMotion } from "../../hooks/useMotionPrefs";
import { MEDIA, MOTION, clamp, refreshScroll, subscribeScroll } from "../../lib/motion";
import { strings } from "../../lib/strings";

// "Anatomy of a WRISTORY" (roadmap §6.1 #7, §7 #11). Heading and callouts come
// from `home_sections.anatomy` (config.callouts), falling back to strings.anatomy.
// Mobile: drawing on top, callouts stacked. lg+: drawing centred, callouts split
// left / right.
// Motion: on a tall desktop screen with a mouse the section pins (CSS sticky) and
// scroll progress draws the watch, then fades the callouts and markers in one by
// one. Elsewhere the drawing draws once when it scrolls into view. Reduced
// motion: static.

// Marker positions on the 320×480 drawing, in callout order (first four shown).
const MARKERS = [
  { x: 160, y: 164 }, // crystal: upper dial
  { x: 238, y: 240 }, // case: bezel edge, right
  { x: 160, y: 262 }, // movement: centre of dial
  { x: 270, y: 218 }, // water resistance: crown
];

// Scroll progress windows. Progress runs 0–1 from the section's top reaching
// mid-viewport (so drawing starts as it scrolls in) to the end of the pin.
const LEAD_IN = 0.5; // viewport heights before the pin where progress starts
const DRAW_FROM = 0;
const DRAW_SPAN = 0.45; // strokes staggered, all drawn by 0.45
const CALLOUTS_FROM = 0.45;
const CALLOUTS_SPAN = 0.45; // staggered; the last is fully in by ~0.8, then a hold
const FADE_SPAN = 0.08;

// Shared width for the drawing and its marker layer; on lg it also shrinks on
// short screens so the pinned section fits in the viewport.
const FIGURE_WIDTH = "w-full max-w-[280px] lg:max-w-[min(340px,38vh)]";

function WatchDrawing({ label, mode, drawn }) {
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
  // Every stroke gets pathLength 1 so a 0–1 dash offset draws it. "scrub" starts
  // undrawn (Anatomy writes the offsets); "reveal" draws once when `drawn`.
  const line = mode === "static" ? {} : {
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: mode === "scrub" || !drawn ? 1 : undefined,
    className: mode === "reveal" && drawn ? "animate-stroke-draw" : undefined,
    "data-draw": "",
  };
  return (
    <svg
      viewBox="0 0 320 480"
      role="img"
      aria-label={label}
      className={`mx-auto h-auto text-brand ${FIGURE_WIDTH}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    >
      {/* Strap */}
      <path d="M118 52 L124 6 H196 L202 52" {...line} />
      <path d="M118 428 L124 474 H196 L202 428" {...line} />
      <path d="M140 14 V40 M180 14 V40 M140 440 V466 M180 440 V466" opacity="0.5" {...line} />
      {/* Crown */}
      <rect x="246" y="228" width="16" height="24" rx="2" {...line} />
      <path d="M250 232 V248 M254 232 V248 M258 232 V248" opacity="0.5" {...line} />
      {/* Case, bezel, crystal */}
      <circle cx="160" cy="240" r="96" {...line} />
      <circle cx="160" cy="240" r="84" opacity="0.6" {...line} />
      <circle cx="160" cy="240" r="70" {...line} />
      {/* Hour ticks */}
      <g transform="translate(160 240)">
        {ticks.map((deg) => (
          <path key={deg} d="M0 -64 V-54" transform={`rotate(${deg})`} strokeWidth={deg % 90 === 0 ? 2 : 1.25} {...line} />
        ))}
      </g>
      {/* Hands */}
      <path d="M160 240 V196" strokeWidth="2" {...line} />
      <path d="M160 240 L190 256" strokeWidth="2" {...line} />
      <circle cx="160" cy="240" r="3" fill="currentColor" />
      {/* Crystal highlight */}
      <path d="M108 206 A58 58 0 0 1 142 178" opacity="0.5" {...line} />
      {/* Lugs */}
      <path d="M118 52 L96 176 M202 52 L224 176 M118 428 L96 304 M202 428 L224 304" opacity="0.35" {...line} />
    </svg>
  );
}

function Callout({ index, title, text }) {
  return (
    <li data-step={index} className="flex gap-4 border-t border-line pt-5">
      <span aria-hidden="true" className="text-h3 text-brand tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex flex-col gap-2">
        <h3 className="text-h3 text-fg">{title}</h3>
        <p className="text-small text-muted">{text}</p>
      </div>
    </li>
  );
}

// Writes the pinned section's scroll progress straight to the DOM (no React
// renders per frame): stroke offsets, then callout + marker opacity/transform.
function usePinnedScrub(sectionRef, enabled, count) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!enabled || !section) return undefined;
    const strokes = [...section.querySelectorAll("[data-draw]")];
    const steps = [...section.querySelectorAll("[data-step]")];
    let box = { top: 0, height: 0 };
    const measure = () => {
      const rect = section.getBoundingClientRect();
      box = { top: rect.top + window.scrollY, height: rect.height };
      refreshScroll();
    };
    const update = (scrollY) => {
      const lead = window.innerHeight * LEAD_IN;
      const distance = box.height - window.innerHeight + lead;
      if (distance <= lead) return;
      const progress = clamp((scrollY - box.top + lead) / distance, 0, 1);
      strokes.forEach((stroke, i) => {
        const start = DRAW_FROM + (i / strokes.length) * (DRAW_SPAN / 2);
        const drawn = clamp((progress - start) / (DRAW_SPAN / 2), 0, 1);
        stroke.style.strokeDashoffset = String((1 - drawn).toFixed(3));
      });
      steps.forEach((step) => {
        const index = Number(step.dataset.step);
        const start = CALLOUTS_FROM + (index / Math.max(count, 1)) * (CALLOUTS_SPAN - FADE_SPAN);
        const shown = clamp((progress - start) / FADE_SPAN, 0, 1);
        step.style.opacity = shown.toFixed(3);
        step.style.transform = step.dataset.marker !== undefined
          ? `translate(-50%, -50%) scale(${(0.6 + 0.4 * shown).toFixed(3)})`
          : `translate3d(0, ${((1 - shown) * 16).toFixed(1)}px, 0)`;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(document.body);
    const unsubscribe = subscribeScroll(update);
    return () => {
      observer.disconnect();
      unsubscribe();
      strokes.forEach((stroke) => stroke.style.removeProperty("stroke-dashoffset"));
      steps.forEach((step) => {
        step.style.removeProperty("opacity");
        step.style.removeProperty("transform");
      });
    };
  }, [sectionRef, enabled, count]);
}

function Anatomy() {
  const { data } = useHomeSections();
  const section = data?.find((s) => s.key === "anatomy");
  const uid = useId();
  const sectionRef = useRef(null);
  const reduced = useReducedMotion();
  const pinned = useMediaQuery(MEDIA.pinned) && !reduced;
  const [figureRef, figureInView] = useInView({ threshold: 0.3 });

  const configured = Array.isArray(section?.config?.callouts) ? section.config.callouts : [];
  const callouts = (configured.length ? configured : strings.anatomy.callouts).filter(
    (c) => c && typeof c.title === "string" && c.title.trim(),
  );
  usePinnedScrub(sectionRef, pinned && callouts.length > 0, callouts.length);
  if (!callouts.length) return null;

  const half = Math.ceil(callouts.length / 2);
  const left = callouts.slice(0, half);
  const right = callouts.slice(half);
  const mode = reduced ? "static" : pinned ? "scrub" : "reveal";

  const grid = (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-16">
      <ul className="order-2 grid gap-6 sm:grid-cols-2 lg:order-1 lg:grid-cols-1 lg:gap-10 lg:text-right">
        {left.map((c, i) => (
          <Callout key={c.key || c.title} index={i} title={c.title} text={c.text} />
        ))}
      </ul>

      <div ref={figureRef} className="relative order-1 lg:order-2">
        <WatchDrawing label={strings.anatomy.figureLabel} mode={mode} drawn={figureInView} />
        <div aria-hidden="true" className={`pointer-events-none absolute inset-0 mx-auto ${FIGURE_WIDTH}`}>
          {callouts.slice(0, MARKERS.length).map((c, i) => (
            <span
              key={c.key || c.title}
              data-step={i}
              data-marker=""
              style={{ left: `${(MARKERS[i].x / 320) * 100}%`, top: `${(MARKERS[i].y / 480) * 100}%` }}
              className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand bg-obsidian text-[0.625rem] font-semibold text-brand tabular-nums"
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      <ul className="order-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-1 lg:gap-10">
        {right.map((c, i) => (
          <Callout key={c.key || c.title} index={half + i} title={c.title} text={c.text} />
        ))}
      </ul>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby={`${uid}-title`}
      style={pinned ? { height: `${MOTION.anatomyPinVh}vh` } : undefined}
      className={`section-dark ${pinned ? "relative" : "py-section-sm lg:py-section"}`}
    >
      <div className={pinned ? "sticky top-0 flex h-screen items-center overflow-hidden" : undefined}>
        <Container className="flex w-full flex-col gap-12 lg:gap-16">
          <SectionHeading
            eyebrow={section?.title || strings.anatomy.eyebrow}
            title={section?.subtitle || strings.anatomy.title}
            id={`${uid}-title`}
          />
          {pinned ? grid : <Reveal>{grid}</Reveal>}
        </Container>
      </div>
    </section>
  );
}

export default Anatomy;
