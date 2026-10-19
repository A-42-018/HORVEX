import { Link } from "react-router";
import { useSiteSettings } from "../../hooks/useContent";
import { strings } from "../../lib/strings";

// Each group must be wider than the bar so the loop has no gap: short lists
// are repeated until a group holds at least this many messages.
const MIN_PER_GROUP = 8;
const SECONDS_PER_MESSAGE = 5;

function Separator() {
  return <span aria-hidden="true" className="mx-6 inline-block h-1 w-1 rotate-45 bg-gold sm:mx-10" />;
}

function Message({ item, hidden }) {
  const inner = <span className="whitespace-nowrap">{item.text}</span>;
  const linkClass =
    "whitespace-nowrap underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
  const tabIndex = hidden ? -1 : undefined;

  if (!item.link) return inner;
  if (item.link.startsWith("/")) {
    return (
      <Link to={item.link} className={linkClass} tabIndex={tabIndex}>
        {item.text}
      </Link>
    );
  }
  return (
    <a href={item.link} className={linkClass} tabIndex={tabIndex} rel="noopener noreferrer">
      {item.text}
    </a>
  );
}

// Messages come from site_settings.announcements ([{ text, link? }]).
// Marquee loops by translating two identical groups; only the first copy is
// exposed to assistive tech. Hover or focus pauses it; under reduced motion
// it stops and becomes a static, scrollable row.
function AnnouncementBar() {
  const { data, isPending } = useSiteSettings();

  const items = (Array.isArray(data?.announcements) ? data.announcements : []).filter(
    (a) => typeof a?.text === "string" && a.text.trim(),
  );

  // Reserve the 36px while loading so the header doesn't jump.
  if (isPending) return <div className="section-dark h-9" aria-hidden="true" />;
  if (items.length === 0) return null;

  const reps = Math.max(1, Math.ceil(MIN_PER_GROUP / items.length));
  const groupSize = items.length * reps;
  const duration = `${groupSize * SECONDS_PER_MESSAGE}s`;

  return (
    <section
      aria-label={strings.announcement.label}
      className="section-dark relative h-9 overflow-hidden text-small font-medium text-brand"
    >
      <div className="group/bar flex h-full overflow-hidden motion-reduce:overflow-x-auto [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] motion-reduce:[mask-image:none]">
        <div
          className="flex w-max items-center motion-safe:animate-marquee motion-safe:hover:[animation-play-state:paused] motion-safe:focus-within:[animation-play-state:paused] motion-reduce:mx-auto"
          style={{ "--marquee-duration": duration }}
        >
          {[0, 1].map((group) => (
            <div
              key={group}
              className={`flex shrink-0 items-center ${group === 1 ? "motion-reduce:hidden" : ""}`}
              aria-hidden={group === 1 ? "true" : undefined}
            >
              {Array.from({ length: reps }, (_, rep) =>
                items.map((item, i) => (
                  <span key={`${rep}-${i}`} className="flex items-center">
                    <Message item={item} hidden={group === 1 || rep > 0} />
                    <Separator />
                  </span>
                )),
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AnnouncementBar;
