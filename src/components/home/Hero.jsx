import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Pause, Play } from "lucide-react";
import { useHeroSlides } from "../../hooks/useContent";
import { responsiveImage } from "../../lib/images";
import { strings } from "../../lib/strings";
import { Button, Container, Skeleton } from "../common";
import { BezelRing, LightSweep, Magnetic, MaskReveal, Parallax } from "../motion";
import { useReducedMotion } from "../../hooks/useMotionPrefs";

const INTERVAL = 6500;
const DESKTOP_WIDTHS = [1080, 1600, 2560];
const MOBILE_WIDTHS = [480, 720, 1080];
const pad = (n) => String(n).padStart(2, "0");
const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

// "Time, *Refined.*" → the starred part is set in italic gold.
const headlineSegments = (text) =>
  text
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("*") ? { text: part.slice(1, -1), em: true, className: "italic text-brand" } : { text: part },
    );

// Shared by SlideImage and the LCP preload so both request the same URLs.
function slideSources(slide) {
  return {
    desktop: responsiveImage(slide.image_desktop, { aspect: [16, 9], widths: DESKTOP_WIDTHS }),
    mobile: responsiveImage(slide.image_mobile || slide.image_desktop, {
      aspect: slide.image_mobile ? [4, 5] : [16, 9],
      widths: MOBILE_WIDTHS,
    }),
  };
}

function SlideImage({ slide, priority }) {
  const { desktop, mobile } = slideSources(slide);
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
  const reduced = useReducedMotion();

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

  const first = slideSources(slides[0]);
  // Same split as SlideImage's <source media>, so each viewport preloads only the image it shows.
  const preloads = [
    { image: first.mobile, media: "(max-width: 1023px)" },
    { image: first.desktop, media: "(min-width: 1024px)" },
  ].filter((p) => p.image.src);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={strings.hero.label}
      className="section-dark relative overflow-hidden"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      {/* LCP: hoisted into <head> by React 19. */}
      {preloads.map(({ image, media }) => (
        <link key={media} rel="preload" as="image" href={image.src} imageSrcSet={image.srcSet} imageSizes="100vw" media={media} fetchPriority="high" />
      ))}

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
              <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto">
                <Parallax>
                  <SlideImage slide={slide} priority={i === 0} />
                </Parallax>
                {active && <LightSweep />}
                <div className="absolute inset-0 hidden bg-gradient-to-r from-obsidian/85 via-obsidian/40 to-transparent lg:block" aria-hidden="true" />
              </div>

              <div className="relative flex flex-1 items-center py-10 lg:py-0">
                <Container>
                  <div className="flex max-w-xl flex-col items-start gap-5 pb-14 lg:pb-0">
                    {slide.eyebrow && <p className="text-eyebrow text-brand">{slide.eyebrow}</p>}
                    {/* Remounts on activation so each slide's headline reveals as it comes in. */}
                    <MaskReveal
                      key={active ? "active" : "idle"}
                      as={i === 0 ? "h1" : "h2"}
                      segments={headlineSegments(slide.title)}
                      play={active}
                      className="text-display text-fg"
                    />
                    {slide.subtitle && <p className="max-w-md text-body text-muted">{slide.subtitle}</p>}
                    {slide.cta_label && slide.cta_link && (
                      <Magnetic className="mt-2 w-full sm:w-auto">
                        <Button as={Link} to={slide.cta_link} size="lg" className="w-full sm:w-auto">
                          {slide.cta_label}
                        </Button>
                      </Magnetic>
                    )}
                  </div>
                </Container>
              </div>
            </div>
          );
        })}
      </div>

      {/* Minute-track ring around the hero watch (desktop). */}
      <div aria-hidden="true" className="pointer-events-none absolute right-[8%] top-1/2 hidden w-[min(36vw,70svh)] -translate-y-1/2 opacity-40 lg:block">
        <BezelRing className="aspect-square w-full" />
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
