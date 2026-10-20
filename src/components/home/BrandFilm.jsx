import { useId, useState } from "react";
import { Link } from "react-router";
import { Play } from "lucide-react";
import { Button, Container, Reveal } from "../common";
import DialogShell from "../common/DialogShell";
import { Parallax } from "../motion";
import { useHomeSections } from "../../hooks/useContent";
import { useInView } from "../../hooks/useInView";
import { responsiveImage } from "../../lib/images";
import { isVideoFile, parseVideo } from "../../lib/video";
import { strings } from "../../lib/strings";

// Brand film band (roadmap §6.1 #9). Copy, poster, film and CTA come from
// `home_sections.brand_film` (title/subtitle, config.{poster, loop_url,
// video_url, cta_label, cta_link}), falling back to strings.brandFilm.
// Nothing video-related loads up front: the optional muted background loop
// (config.loop_url, a direct file) starts only once the band scrolls into view
// (and never under reduced motion / data saver); the full film mounts only
// while the modal is open. With no playable `video_url` the play button is
// omitted instead of faking a film.

const POSTER_SIZES = "100vw";
const POSTER_WIDTHS = [640, 960, 1280, 1920, 2560];

const canLoopVideo = () =>
  typeof window !== "undefined" &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !navigator.connection?.saveData;

function CtaLink({ to, children }) {
  const external = /^https?:\/\//i.test(to);
  return external ? (
    <Button as="a" href={to} target="_blank" rel="noopener noreferrer" variant="secondary" size="lg">
      {children}
    </Button>
  ) : (
    <Button as={Link} to={to} variant="secondary" size="lg">
      {children}
    </Button>
  );
}

function FilmPlayer({ video }) {
  if (video.kind === "embed") {
    return (
      <iframe
        src={video.src}
        title={strings.brandFilm.iframeTitle}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full border-0"
      />
    );
  }
  return (
    <video src={video.src} controls autoPlay playsInline className="h-full w-full bg-obsidian" data-autofocus />
  );
}

function BrandFilm() {
  const { data } = useHomeSections();
  const section = data?.find((s) => s.key === "brand_film");
  const config = section?.config ?? {};
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.1, rootMargin: "200px 0px" });

  const film = parseVideo(config.video_url);
  const loopSrc = isVideoFile(config.loop_url) ? config.loop_url : null;
  const poster = config.poster ? responsiveImage(config.poster, { aspect: [16, 9], widths: POSTER_WIDTHS }) : null;
  const ctaLink = config.cta_link || strings.brandFilm.ctaLink;
  const ctaLabel = config.cta_label || strings.brandFilm.ctaLabel;

  return (
    <section
      ref={ref}
      aria-labelledby={`${uid}-title`}
      className="section-dark relative isolate flex min-h-[32rem] items-center overflow-hidden bg-obsidian py-section-sm lg:min-h-[44rem] lg:py-section"
    >
      <Parallax className="-z-20">
        {poster?.src && (
          <img
            src={poster.src}
            srcSet={poster.srcSet}
            sizes={poster.srcSet ? POSTER_SIZES : undefined}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
        )}
        {loopSrc && inView && canLoopVideo() && (
          <video
            src={loopSrc}
            poster={poster?.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
        )}
      </Parallax>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-obsidian/60" />

      <Container>
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
          {film && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={strings.brandFilm.play}
              aria-haspopup="dialog"
              className="group inline-flex h-20 w-20 items-center justify-center rounded-full border border-brand text-brand transition-[background-color,color,transform] duration-base hover:bg-gold hover:text-obsidian active:scale-95"
            >
              <Play aria-hidden="true" size={28} strokeWidth={1.5} className="ml-1 fill-current" />
            </button>
          )}
          <div className="flex flex-col items-center gap-4">
            <p className="text-eyebrow">{strings.brandFilm.eyebrow}</p>
            <h2 id={`${uid}-title`} className="text-h1 text-fg">
              {section?.title || strings.brandFilm.title}
            </h2>
            <p className="max-w-xl text-body text-fg/80">{section?.subtitle || strings.brandFilm.subtitle}</p>
          </div>
          <CtaLink to={ctaLink}>{ctaLabel}</CtaLink>
        </Reveal>
      </Container>

      {film && (
        <DialogShell
          open={open}
          onClose={() => setOpen(false)}
          title={strings.brandFilm.modalTitle}
          panelClass={(visible) =>
            `absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-[min(64rem,calc((100dvh-6rem)*16/9))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-card border border-line shadow-surface transition-[opacity,transform] duration-base ${
              visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`
          }
        >
          <div className="aspect-video w-full bg-obsidian">{open && <FilmPlayer video={film} />}</div>
        </DialogShell>
      )}
    </section>
  );
}

export default BrandFilm;
