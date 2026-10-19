import { useCallback, useEffect, useId, useState } from "react";
import { Link } from "react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Container, IconButton, Reveal, SectionHeading } from "../common";
import { ProductCardSkeleton } from "../product";
import ProductCard from "./ProductCard";
import { useProducts } from "../../hooks/useCatalog";
import { useHomeSections } from "../../hooks/useContent";
import { responsiveImage } from "../../lib/images";
import { strings } from "../../lib/strings";

// "Shop for Him / Shop for Her" (roadmap §6.1 #8). Two editorial panels, each a
// lifestyle image + a mini product carousel (Embla, swipe on touch, arrows on
// pointer devices). Copy, links, images and the per-side count come from
// `home_sections.him_her` (config.him / config.her / config.products_per_side),
// falling back to strings.himHer. Mobile: panels stacked; lg+: side by side.

const DEFAULT_COUNT = 4;
const MAX_COUNT = 8;
const IMAGE_SIZES = "(min-width: 1024px) 50vw, 100vw";
// Slide widths: ~2.2 cards visible on mobile so the next one peeks.
const SLIDE = "min-w-0 shrink-0 grow-0 basis-[46%] pl-4 first:pl-0 sm:basis-[34%] lg:basis-[40%] xl:basis-[34%]";

function MiniCarousel({ query, label }) {
  const [viewportRef, embla] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback((api) => {
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!embla) return undefined;
    sync(embla);
    embla.on("select", sync).on("reInit", sync).on("scroll", sync);
    return () => {
      embla.off("select", sync).off("reInit", sync).off("scroll", sync);
    };
  }, [embla, sync]);

  const { data, isPending, isError } = query;
  const items = data?.items ?? [];

  if (isError && !data) {
    return (
      <p role="alert" className="text-small text-muted">
        {strings.data.loadError}
      </p>
    );
  }
  if (!isPending && !items.length) {
    return <p className="text-small text-muted">{strings.himHer.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={viewportRef} className="overflow-hidden" role="region" aria-roledescription="carousel" aria-label={label}>
        <ul className="flex" aria-busy={isPending ? "true" : undefined}>
          {isPending
            ? Array.from({ length: DEFAULT_COUNT }, (_, i) => (
                <li key={i} className={SLIDE}>
                  <ProductCardSkeleton />
                </li>
              ))
            : items.map((product) => (
                <li key={product.id} className={SLIDE}>
                  <ProductCard product={product} />
                </li>
              ))}
        </ul>
      </div>

      {/* Arrows only help pointer users; touch swipes. Hidden when everything fits. */}
      {(canPrev || canNext) && (
        <div className="hidden items-center justify-end gap-2 md:flex">
          <IconButton label={strings.himHer.prev} disabled={!canPrev} onClick={() => embla?.scrollPrev()}>
            <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={strings.himHer.next} disabled={!canNext} onClick={() => embla?.scrollNext()}>
            <ChevronRight aria-hidden="true" size={20} strokeWidth={1.5} />
          </IconButton>
        </div>
      )}
    </div>
  );
}

function Side({ side, config, gender, count }) {
  const copy = strings.himHer[side];
  const title = config?.title || copy.title;
  const link = config?.link || copy.link;
  const image = config?.image ? responsiveImage(config.image, { aspect: [4, 5], widths: [480, 720, 960, 1200] }) : null;
  const query = useProducts({ gender, limit: count });

  return (
    <div className="flex flex-col gap-6">
      <Link to={link} className="tokens-dark group relative block aspect-[4/5] overflow-hidden rounded-card bg-raised sm:aspect-[16/11] lg:aspect-[4/5]">
        {image?.src && (
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes={image.srcSet ? IMAGE_SIZES : undefined}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-reveal ease-out-expo [@media(hover:hover)]:group-hover:scale-[1.04]"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-obsidian/85 via-obsidian/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 lg:p-8">
          <h3 className="text-h2 text-fg">{title}</h3>
          <span className="inline-flex min-h-11 items-center gap-2 text-button text-brand">
            {strings.himHer.shop}
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} className="transition-transform duration-base group-hover:translate-x-1" />
          </span>
        </div>
      </Link>

      <MiniCarousel query={query} label={copy.carouselLabel} />
    </div>
  );
}

function HimHer() {
  const { data } = useHomeSections();
  const section = data?.find((s) => s.key === "him_her");
  const uid = useId();

  const configured = Number(section?.config?.products_per_side);
  const count = configured > 0 ? Math.min(Math.floor(configured), MAX_COUNT) : DEFAULT_COUNT;

  return (
    <section aria-labelledby={`${uid}-title`} className="section-dark py-section-sm lg:py-section">
      <Container className="flex flex-col gap-12 lg:gap-16">
        <SectionHeading
          eyebrow={section?.title || strings.himHer.eyebrow}
          title={section?.subtitle || strings.himHer.title}
          id={`${uid}-title`}
        />
        <Reveal>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-10">
            <Side side="him" config={section?.config?.him} gender="men" count={count} />
            <Side side="her" config={section?.config?.her} gender="women" count={count} />
          </div>
        </Reveal>
        <div className="flex justify-center">
          <Button as={Link} to="/shop" variant="secondary">
            {strings.himHer.viewAll}
          </Button>
        </div>
      </Container>
    </section>
  );
}

export default HimHer;
