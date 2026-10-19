import { useHomeSections } from "../../hooks/useContent";
import { strings } from "../../lib/strings";

// Slim, slow trust ticker under the hero. Items come from the `trust_marquee`
// home section (config.items), falling back to strings.trust.items.
// The list renders twice; the second copy is aria-hidden and the track moves
// by -50% (transform only). Pauses on hover/focus; reduced-motion shows a
// static wrapped row (see index.css).
function TrustMarquee() {
  const { data } = useHomeSections();
  const configured = data?.find((s) => s.key === "trust_marquee")?.config?.items;
  const items = (Array.isArray(configured) ? configured : strings.trust.items).filter(
    (t) => typeof t === "string" && t.trim(),
  );
  if (!items.length) return null;

  const row = (hidden) => (
    <ul className="trust-marquee__row" aria-hidden={hidden || undefined}>
      {items.map((text) => (
        <li key={text} className="flex shrink-0 items-center gap-8 pr-8 text-eyebrow text-muted">
          <span>{text}</span>
          <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-brand" />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={strings.trust.label} className="trust-marquee border-y border-line bg-surface">
      <div className="trust-marquee__track py-4">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}

export default TrustMarquee;
