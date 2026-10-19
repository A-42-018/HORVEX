import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Pause, Play } from "lucide-react";
import { useHeroSlides } from "../../hooks/useContent";
import { responsiveImage } from "../../lib/images";
import { strings } from "../../lib/strings";
import { Button, Container, Skeleton } from "../common";

const INTERVAL = 6500;
const DESKTOP_WIDTHS = [1080, 1600, 2560];
const MOBILE_WIDTHS = [480, 720, 1080];
const pad = (n) => String(n).padStart(2, "0");
const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

// "Time, *Refined.*" → the starred part is set in italic gold.
function Headline({ text }) {
  return text.split(/(\*[^*]+\*)/).map((part, i) =>
    part.startsWith("*") ? (
      <em key={i} className="italic text-brand">
        {part.slice(1, -1)}
      </em>
    ) : (
      part
    ),
  );
}

function SlideImage({ slide, priority }) {
  const desktop = responsiveImage(slide.image_desktop, { aspect: [16, 9], widths: DESKTOP_WIDTHS });
  const mobile = responsiveImage(slide.image_mobile || slide.image_desktop, {
    aspect: slide.image_mobile ? [4, 5] : [16, 9],
    widths: MOBILE_WIDTHS,
  });
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={desktop.srcSet} sizes="100vw" />
      <img
        src={mobile.src}
        srcSet={mobile.srcSet}
        sizes="100vw"
        alt=""
        width={1080}
        height={1350}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding={priority ? "sync" : "async"}
        className="h-full w-full object-cover"
      />
    </picture>
  );
}

function HeroSkeleton() {
  return (
    <section className="section-dark min-h-svh" aria-busy="true">
      <Skeleton className="aspect-[4/5] w-full lg:absolute lg:inset-0 lg:aspect-auto lg:h-svh" />
    </section>
  );
}

function Hero() {
  const { data, isPending } = useHeroSlides();
  const slides = data ?? [];
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // user toggle
  const [hold, setHold] = useState(false); // hover / focus
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const playing = total > 1 && !paused && !hold && !reduced;
  const go = useCallback((i) => setIndex(((i % total) + total) % total), [total]);

  // `index` is a dependency so every manual change restarts the timer.
  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setTimeout(() => go(index + 1), INTERVAL);
    return () => window.clearTimeout(id);
  }, [playing, index, go]);

  if (isPending) return <HeroSkeleton />;
  if (!total) return null;

  const first = responsiveImage(slides[0].image_mobile || slides[0].image_desktop, { aspect: [4, 5], widths: MOBILE_WIDTHS });

  return (
    <section
      aria-roledescription="carousel"
      aria-label={strings.hero.label}
      className="section-dark relative"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      {/* LCP: hoisted into <head> by React 19. */}
      {first.src && <link rel="preload" as="image" href={first.src} imageSrcSet={first.srcSet} imageSizes="100vw" fetchPriority="high" />}

      {/* Slides share one grid cell, so the tallest sets the height and fades never reflow. */}
      <div className="grid lg:min-h-svh">
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={fill(strings.hero.slide, { n: i + 1, total })}
              aria-hidden={!active}
              inert={!active}
              className={`col-start-1 row-start-1 flex flex-col transition-opacity duration-slow ease-out-expo lg:relative lg:min-h-svh ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <div className="aspect-[4/5] w-full sm:aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto">
                <SlideImage slide={slide} priority={i === 0} />
                <div className="absolute inset-0 hidden bg-gradient-to-r from-obsidian/85 via-obsidian/40 to-transparent lg:block" aria-hidden="true" />
              </div>

              <div className="relative flex flex-1 items-center py-10 lg:py-0">
                <Container>
                  <div className="flex max-w-xl flex-col items-start gap-5 pb-14 lg:pb-0">
                    {slide.eyebrow && <p className="text-eyebrow text-brand">{slide.eyebrow}</p>}
                    {i === 0 ? (
                      <h1 className="text-display text-fg">
                        <Headline text={slide.title} />
                      </h1>
                    ) : (
                      <h2 className="text-display text-fg">
                        <Headline text={slide.title} />
                      </h2>
                    )}
                    {slide.subtitle && <p className="max-w-md text-body text-muted">{slide.subtitle}</p>}
                    {slide.cta_label && slide.cta_link && (
                      <Button as={Link} to={slide.cta_link} size="lg" className="mt-2 w-full sm:w-auto">
                        {slide.cta_label}
                      </Button>
                    )}
                  </div>
                </Container>
              </div>
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-10 pb-4 lg:pb-8">
          <Container>
            <div className="flex items-center gap-2">
              <ol className="flex items-center">
                {slides.map((slide, i) => (
                  <li key={slide.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => go(i)}
                      aria-label={fill(strings.hero.goTo, { n: i + 1 })}
                      aria-current={i === index ? "true" : undefined}
                      className={`flex h-11 min-w-11 items-center justify-center text-small tabular-nums transition-colors duration-fast ${i === index ? "text-fg" : "text-muted hover:text-fg"}`}
                    >
                      {pad(i + 1)}
                    </button>
                    {i < total - 1 && <span aria-hidden="true" className="relative h-px w-8 bg-line sm:w-12">
                      {i === index && playing && (
                        <span key={index} className="absolute inset-0 origin-left bg-gold" style={{ animation: `hero-progress ${INTERVAL}ms linear forwards` }} />
                      )}
                    </span>}
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? strings.hero.play : strings.hero.pause}
                className="ml-auto flex h-11 w-11 items-center justify-center text-muted hover:text-fg"
              >
                {paused ? <Play size={20} strokeWidth={1.5} /> : <Pause size={20} strokeWidth={1.5} />}
              </button>
            </div>
          </Container>
        </div>
      )}
      <div aria-live={playing ? "off" : "polite"} className="sr-only">
        {fill(strings.hero.slide, { n: index + 1, total })}
      </div>
    </section>
  );
}

export default Hero;
