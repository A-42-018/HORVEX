import { useId } from "react";
import { Link } from "react-router";
import { Button, Container, Reveal } from "../common";
import { useBanners, useHomeSections } from "../../hooks/useContent";
import { useNow } from "../../hooks/useNow";
import { responsiveImage } from "../../lib/images";
import { strings } from "../../lib/strings";

// Promo banners (roadmap §6.1 #10). Up to two active `banners` rows with
// placement `home_promo`; heading overrides come from `home_sections.promo`
// (title/subtitle). A banner with `countdown_to` shows a live countdown and is
// hidden the moment it expires; with no live banner the whole section is
// omitted. No "% claimed" bar: there is no stock-claimed data to back it.

const MAX_BANNERS = 2;
const DESKTOP_WIDTHS = [640, 960, 1280, 1600];
const MOBILE_WIDTHS = [480, 720, 1080];

const pad = (n) => String(n).padStart(2, "0");

function parts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function Countdown({ remaining }) {
  const t = parts(remaining);
  const cells = [
    ["days", t.days],
    ["hours", t.hours],
    ["minutes", t.minutes],
    ["seconds", t.seconds],
  ];
  const label = `${strings.promo.endsIn} ${t.days} ${strings.promo.units.days}, ${t.hours} ${strings.promo.units.hours}, ${t.minutes} ${strings.promo.units.minutes}`;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-eyebrow">{strings.promo.endsIn}</p>
      {/* role=timer is not announced on every tick; the label updates per render. */}
      <div role="timer" aria-label={label} className="flex gap-2 sm:gap-3">
        {cells.map(([unit, value]) => (
          <div
            key={unit}
            aria-hidden="true"
            className="flex min-w-14 flex-col items-center rounded-card border border-line bg-obsidian/60 px-2 py-2 backdrop-blur-sm sm:min-w-16"
          >
            <span className="text-price text-fg">{pad(value)}</span>
            <span className="text-small text-muted">{strings.promo.units[unit]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BannerCta({ to, children }) {
  const external = /^https?:\/\//i.test(to);
  return external ? (
    <Button as="a" href={to} target="_blank" rel="noopener noreferrer" size="lg">
      {children}
    </Button>
  ) : (
    <Button as={Link} to={to} size="lg">
      {children}
    </Button>
  );
}

function BannerCard({ banner, remaining }) {
  const desktop = banner.image
    ? responsiveImage(banner.image, { aspect: [16, 9], widths: DESKTOP_WIDTHS })
    : null;
  const mobile = banner.image_mobile
    ? responsiveImage(banner.image_mobile, { aspect: [1, 1], widths: MOBILE_WIDTHS })
    : null;
  const fallback = desktop?.src ? desktop : mobile;

  return (
    <article className="tokens-dark relative isolate flex aspect-square flex-col justify-end overflow-hidden rounded-card bg-raised sm:aspect-video">
      {fallback?.src && (
        <picture>
          {mobile?.src && desktop?.src && (
            <source
              media="(max-width: 639px)"
              srcSet={mobile.srcSet || mobile.src}
              sizes={mobile.srcSet ? "100vw" : undefined}
            />
          )}
          <img
            src={fallback.src}
            srcSet={desktop?.srcSet}
            sizes={desktop?.srcSet ? "(min-width: 1024px) 50vw, 100vw" : undefined}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
        </picture>
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-obsidian/90 via-obsidian/40 to-obsidian/10" />

      <div className="flex flex-col items-start gap-4 p-5 sm:p-8">
        {remaining != null && <Countdown remaining={remaining} />}
        <div className="flex flex-col gap-2">
          {banner.title && <h3 className="text-h2 text-fg">{banner.title}</h3>}
          {banner.subtitle && <p className="max-w-md text-body text-fg/80">{banner.subtitle}</p>}
        </div>
        {banner.link && <BannerCta to={banner.link}>{strings.promo.cta}</BannerCta>}
      </div>
    </article>
  );
}

function PromoBanner() {
  const uid = useId();
  const { data: banners } = useBanners("home_promo");
  const { data: sections } = useHomeSections();
  const section = sections?.find((s) => s.key === "promo");

  const hasCountdown = Boolean(banners?.some((b) => b.countdown_to));
  const now = useNow(hasCountdown);

  const live = (banners ?? [])
    .map((b) => {
      const end = b.countdown_to ? Date.parse(b.countdown_to) : null;
      return { banner: b, remaining: Number.isFinite(end) ? end - now : null };
    })
    .filter((b) => b.remaining == null || b.remaining > 0)
    .slice(0, MAX_BANNERS);

  if (!live.length) return null;

  return (
    <section aria-labelledby={`${uid}-title`} className="section-ivory py-section-sm lg:py-section">
      <Container>
        <Reveal className="flex flex-col gap-8 lg:gap-10">
          <div className="flex flex-col gap-3">
            <p className="text-eyebrow">{strings.promo.eyebrow}</p>
            <h2 id={`${uid}-title`} className="text-h2 text-fg">
              {section?.title || strings.promo.title}
            </h2>
            {section?.subtitle && <p className="max-w-xl text-body text-muted">{section.subtitle}</p>}
          </div>
          <div className={`grid gap-4 lg:gap-6 ${live.length > 1 ? "lg:grid-cols-2" : ""}`}>
            {live.map(({ banner, remaining }) => (
              <BannerCard key={banner.id} banner={banner} remaining={remaining} />
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export default PromoBanner;
