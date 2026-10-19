import { useId } from "react";
import { Container, SectionHeading, Reveal } from "../common";
import { useHomeSections } from "../../hooks/useContent";
import { strings } from "../../lib/strings";

// "Anatomy of a HORVEX" (roadmap §6.1 #7), static stacked version: the pinned
// scroll story and line-draw animation come in C2. Heading and callouts come
// from `home_sections.anatomy` (config.callouts), falling back to strings.anatomy.
// Mobile: drawing on top, callouts stacked. lg+: drawing centred, callouts split
// left / right.

// Marker positions on the 320×480 drawing, in callout order (first four shown).
const MARKERS = [
  { x: 160, y: 164 }, // crystal: upper dial
  { x: 238, y: 240 }, // case: bezel edge, right
  { x: 160, y: 262 }, // movement: centre of dial
  { x: 270, y: 218 }, // water resistance: crown
];

function WatchDrawing({ label }) {
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg
      viewBox="0 0 320 480"
      role="img"
      aria-label={label}
      className="mx-auto h-auto w-full max-w-[280px] text-brand lg:max-w-[340px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    >
      {/* Strap */}
      <path d="M118 52 L124 6 H196 L202 52" />
      <path d="M118 428 L124 474 H196 L202 428" />
      <path d="M140 14 V40 M180 14 V40 M140 440 V466 M180 440 V466" opacity="0.5" />
      {/* Crown */}
      <rect x="246" y="228" width="16" height="24" rx="2" />
      <path d="M250 232 V248 M254 232 V248 M258 232 V248" opacity="0.5" />
      {/* Case, bezel, crystal */}
      <circle cx="160" cy="240" r="96" />
      <circle cx="160" cy="240" r="84" opacity="0.6" />
      <circle cx="160" cy="240" r="70" />
      {/* Hour ticks */}
      <g transform="translate(160 240)">
        {ticks.map((deg) => (
          <path key={deg} d="M0 -64 V-54" transform={`rotate(${deg})`} strokeWidth={deg % 90 === 0 ? 2 : 1.25} />
        ))}
      </g>
      {/* Hands */}
      <path d="M160 240 V196" strokeWidth="2" />
      <path d="M160 240 L190 256" strokeWidth="2" />
      <circle cx="160" cy="240" r="3" fill="currentColor" />
      {/* Crystal highlight */}
      <path d="M108 206 A58 58 0 0 1 142 178" opacity="0.5" />
      {/* Lugs */}
      <path d="M118 52 L96 176 M202 52 L224 176 M118 428 L96 304 M202 428 L224 304" opacity="0.35" />
    </svg>
  );
}

function Callout({ index, title, text }) {
  return (
    <li className="flex gap-4 border-t border-line pt-5">
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

function Anatomy() {
  const { data } = useHomeSections();
  const section = data?.find((s) => s.key === "anatomy");
  const uid = useId();

  const configured = Array.isArray(section?.config?.callouts) ? section.config.callouts : [];
  const callouts = (configured.length ? configured : strings.anatomy.callouts).filter(
    (c) => c && typeof c.title === "string" && c.title.trim(),
  );
  if (!callouts.length) return null;

  const half = Math.ceil(callouts.length / 2);
  const left = callouts.slice(0, half);
  const right = callouts.slice(half);

  return (
    <section aria-labelledby={`${uid}-title`} className="section-dark py-section-sm lg:py-section">
      <Container className="flex flex-col gap-12 lg:gap-16">
        <SectionHeading
          eyebrow={section?.title || strings.anatomy.eyebrow}
          title={section?.subtitle || strings.anatomy.title}
          id={`${uid}-title`}
        />

        <Reveal>
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-16">
            <ul className="order-2 grid gap-6 sm:grid-cols-2 lg:order-1 lg:grid-cols-1 lg:gap-10 lg:text-right">
              {left.map((c, i) => (
                <Callout key={c.key || c.title} index={i} title={c.title} text={c.text} />
              ))}
            </ul>

            <div className="relative order-1 lg:order-2">
              <WatchDrawing label={strings.anatomy.figureLabel} />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 mx-auto w-full max-w-[280px] lg:max-w-[340px]">
                {callouts.slice(0, MARKERS.length).map((c, i) => (
                  <span
                    key={c.key || c.title}
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
        </Reveal>
      </Container>
    </section>
  );
}

export default Anatomy;
