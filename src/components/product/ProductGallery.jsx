import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { IconButton } from "../common";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { responsiveImage } from "../../lib/images";
import { prefersReducedMotion } from "../../lib/motion";
import { strings } from "../../lib/strings";
import GalleryLightbox from "./GalleryLightbox";

const WIDTHS = [480, 720, 960, 1200, 1600];
const LENS_SCALE = 2.2;
const g = strings.product.gallery;

// Studio shots first, lifestyle shots after, each group in sort_order.
const orderGalleryImages = (images = []) => [
  ...images.filter((i) => !i.is_lifestyle),
  ...images.filter((i) => i.is_lifestyle),
];

function GalleryImage({ image, name, sizes, eager = false, className = "", style }) {
  const { src, srcSet } = responsiveImage(image.url, { widths: WIDTHS });
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={image.alt || name}
      width={1200}
      height={1500}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`h-full w-full object-cover ${className}`}
      style={style}
    />
  );
}

// Below lg: horizontal scroll-snap track (native swipe, no JS drag). The
// visible slide is read from scroll position; only index changes from outside
// (the lightbox) scroll the track, so swipes and smooth dot scrolls aren't cut short.
function MobileCarousel({ list, name, index, onIndex, onOpen, eager }) {
  const trackRef = useRef(null);
  const scrolledTo = useRef(index); // last index the track itself reported
  const total = list.length;

  const slideWidth = () => trackRef.current?.clientWidth || 1;

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / slideWidth());
    if (next < 0 || next >= total) return;
    scrolledTo.current = next;
    if (next !== index) onIndex(next);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el || index === scrolledTo.current) return;
    scrolledTo.current = index;
    el.scrollTo({ left: index * slideWidth(), behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const scrollToSlide = (i) =>
    trackRef.current?.scrollTo({ left: i * slideWidth(), behavior: prefersReducedMotion() ? "auto" : "smooth" });

  return (
    <div className="relative lg:hidden">
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="tokens-dark flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-card bg-carbon [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {list.map((image, i) => (
          <li
            key={image.id ?? image.url}
            className="aspect-[4/5] w-full shrink-0 snap-center snap-always"
            aria-roledescription="slide"
            aria-label={g.counter(i + 1, total)}
          >
            <button
              type="button"
              onClick={onOpen}
              aria-label={g.zoom}
              className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
            >
              <GalleryImage image={image} name={name} eager={eager && i === 0} sizes="100vw" />
            </button>
          </li>
        ))}
      </ul>

      <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-obsidian/70 text-fg backdrop-blur-sm">
        <Maximize2 aria-hidden="true" size={16} strokeWidth={1.5} />
      </span>

      {total > 1 && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          {list.map((image, i) => (
            <button
              key={image.id ?? image.url}
              type="button"
              onClick={() => scrollToSlide(i)}
              aria-label={g.thumb(i + 1, total)}
              aria-current={i === index}
              className="flex h-11 w-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
            >
              <span
                className={`block h-1.5 rounded-full bg-fg transition-[opacity,transform] duration-fast ${
                  i === index ? "w-4 opacity-100" : "w-1.5 opacity-50"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Desktop: vertical thumbnails + large image. A mouse pointer over the image
// shows a zoom lens (transform only); click/Enter opens the lightbox, and the
// arrow buttons + thumbnails work without any hover. Below lg the same
// component shows a native scroll-snap swipe carousel with dots; tapping a
// slide opens the lightbox (pinch zoom lives there). Only the layout that's
// showing loads its first image eagerly; the hidden one stays lazy (never fetched).
function ProductGallery({ images, name, activeImageId, className = "" }) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const list = orderGalleryImages(images);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zooming, setZooming] = useState(false);
  const imgRef = useRef(null);
  const total = list.length;
  const current = list[Math.min(index, total - 1)];

  // Variant picker drives this: when it names an image, jump the gallery to it.
  useEffect(() => {
    if (!activeImageId) return;
    const next = list.findIndex((image) => image.id === activeImageId);
    if (next >= 0) setIndex(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImageId]);

  if (!current) {
    return (
      <div className={`tokens-dark flex aspect-[4/5] items-center justify-center rounded-card bg-carbon text-small text-muted ${className}`}>
        {g.noImage}
      </div>
    );
  }

  const go = (next) => setIndex((next + total) % total);

  const moveLens = (event) => {
    if (event.pointerType !== "mouse" || !imgRef.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    imgRef.current.style.transformOrigin = `${x}% ${y}%`;
  };

  return (
    <div className={`flex flex-col gap-3 lg:flex-row-reverse lg:gap-4 ${className}`} role="group" aria-label={g.label(name)}>
      <div className="tokens-dark group relative hidden aspect-[4/5] flex-1 overflow-hidden rounded-card bg-carbon lg:block">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          onPointerEnter={(e) => e.pointerType === "mouse" && setZooming(true)}
          onPointerLeave={() => setZooming(false)}
          onPointerMove={moveLens}
          aria-label={g.zoom}
          className={`absolute inset-0 block overflow-hidden ${zooming ? "cursor-zoom-in" : ""}`}
        >
          <span
            ref={imgRef}
            className="block h-full w-full transition-transform duration-slow ease-out will-change-transform"
            style={{ transform: zooming ? `scale(${LENS_SCALE})` : "scale(1)" }}
          >
            <GalleryImage
              key={current.url}
              image={current}
              name={name}
              eager={desktop && index === 0}
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </span>
        </button>

        <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-obsidian/70 text-fg backdrop-blur-sm">
          <Maximize2 aria-hidden="true" size={16} strokeWidth={1.5} />
        </span>

        {total > 1 && (
          <>
            <IconButton
              label={g.prev}
              variant="ghost"
              onClick={() => go(index - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-obsidian/60 backdrop-blur-sm"
            >
              <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} />
            </IconButton>
            <IconButton
              label={g.next}
              variant="ghost"
              onClick={() => go(index + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-obsidian/60 backdrop-blur-sm"
            >
              <ChevronRight aria-hidden="true" size={20} strokeWidth={1.5} />
            </IconButton>
          </>
        )}
      </div>

      <MobileCarousel list={list} name={name} eager={!desktop} index={index} onIndex={setIndex} onOpen={() => setLightbox(true)} />

      {total > 1 && (
        <ul className="hidden gap-2 lg:flex lg:w-20 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:p-1">
          {list.map((image, i) => {
            const active = i === index;
            return (
              <li key={image.id ?? image.url} className="w-full">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={g.thumb(i + 1, total)}
                  aria-current={active}
                  className={`tokens-dark block aspect-[4/5] w-full overflow-hidden rounded-card bg-carbon outline-offset-2 transition-[opacity,box-shadow] duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${
                    active ? "opacity-100 ring-2 ring-brand" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <GalleryImage image={image} name={name} sizes="80px" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <GalleryLightbox
        open={lightbox}
        onClose={() => setLightbox(false)}
        images={list}
        index={index}
        onIndex={setIndex}
        name={name}
      />
    </div>
  );
}

export default ProductGallery;
