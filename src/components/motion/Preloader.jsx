import { useEffect, useState } from "react";
import { DURATION, MOTION, prefersReducedMotion } from "../../lib/motion";

const STORAGE_KEY = "wristory-preloaded";
const TICKS_DONE = MOTION.preloaderTicks * MOTION.preloaderTickStep; // ≤ 1.2s incl. the last tick's fade
const HOLD = TICKS_DONE + DURATION.slow; // wordmark has faded up
const TICKS = Array.from({ length: MOTION.preloaderTicks }, (_, i) => i);

// Once per browser session, never under reduced motion or if storage is blocked.
function shouldShow() {
  if (prefersReducedMotion()) return false;
  try {
    return !sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // storage blocked: shouldShow() already returned false
  }
}

// First-visit preloader (roadmap §7 #1): the monogram's bezel ticks fill like a
// second hand, then the wordmark fades up and the curtain fades out. It never
// blocks input (pointer-events: none, hidden from assistive tech). While it shows,
// `html.is-preloading` holds the hero headline reveal so it plays afterwards.
function Preloader() {
  const [stage, setStage] = useState(() => (shouldShow() ? "in" : "done"));

  useEffect(() => {
    if (stage === "done") return undefined;
    if (stage === "out") {
      const timer = window.setTimeout(() => setStage("done"), DURATION.slow);
      return () => window.clearTimeout(timer);
    }
    markShown();
    const root = document.documentElement;
    root.classList.add("is-preloading");
    const timer = window.setTimeout(() => setStage("out"), HOLD);
    return () => {
      window.clearTimeout(timer);
      root.classList.remove("is-preloading");
    };
  }, [stage]);

  if (stage === "done") return null;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-obsidian ${
        stage === "out" ? "animate-fade-out" : ""
      }`}
    >
      <svg viewBox="0 0 64 64" className="h-20 w-20 text-gold" fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx="32" cy="32" r="27" strokeWidth="1" className="opacity-30" />
        {TICKS.map((i) => (
          <line
            key={i}
            x1="32"
            x2="32"
            y1={i % 5 === 0 ? 3.5 : 4.5}
            y2="7.5"
            strokeWidth={i % 5 === 0 ? 1.5 : 0.75}
            transform={`rotate(${i * 6} 32 32)`}
            className="animate-fade-in"
            style={{ animationDelay: `${i * MOTION.preloaderTickStep}ms`, animationDuration: `${DURATION.fast}ms` }}
          />
        ))}
        <path d="M19 22l5 20 8-13 8 13 5-20" strokeWidth="3" strokeLinecap="square" />
      </svg>
      <span
        className="animate-fade-up font-logo text-body uppercase tracking-wordmark text-ivory"
        style={{ animationDelay: `${TICKS_DONE}ms`, animationDuration: `${DURATION.slow}ms` }}
      >
        WRISTORY
      </span>
    </div>
  );
}

export default Preloader;
