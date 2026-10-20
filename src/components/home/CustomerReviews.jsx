import { useCallback, useEffect, useId, useState } from "react";
import { Link } from "react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, Container, IconButton, Rating, Reveal, SectionHeading, Skeleton } from "../common";
import { RollingNumber } from "../motion";
import { useHomeSections, useRecentReviews, useReviewSummary } from "../../hooks/useContent";
import { responsiveImage } from "../../lib/images";
import { formatDate } from "../../lib/format";
import { prefersReducedMotion } from "../../lib/motion";
import { strings } from "../../lib/strings";

// Reviews & UGC (roadmap §6.1 #12). Approved `reviews` rows only (RLS), newest
// first, with a store-wide rating summary. Heading from `home_sections.reviews`
// (title/subtitle, config.limit). Embla carousel at every width: swipe on touch,
// arrows from md. Reviews with a photo show it above the text.

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 12;
const SLIDE = "min-w-0 shrink-0 grow-0 basis-[86%] pl-4 first:pl-0 sm:basis-[56%] md:basis-[46%] lg:basis-[33.333%]";

function ReviewCard({ review }) {
  const photo = review.photo_url ? responsiveImage(review.photo_url, { aspect: [4, 3], widths: [360, 540, 720] }) : null;
  return (
    <Card className="flex h-full flex-col gap-4 overflow-hidden p-0">
      {photo?.src && (
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={photo.srcSet ? "(min-width: 1024px) 33vw, 86vw" : undefined}
          alt={strings.reviews.photoAlt(review.name)}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Rating value={review.rating} showValue={false} />
        {review.text && <p className="flex-1 text-body text-fg">&ldquo;{review.text}&rdquo;</p>}
        <div className="flex flex-col gap-1 border-t border-line pt-4">
          <span className="text-body font-semibold text-fg">{review.name}</span>
          <span className="text-small text-muted">
            {review.product?.slug && (
              <>
                {strings.reviews.purchased}{" "}
                <Link to={`/product/${review.product.slug}`} className="underline underline-offset-2 hover:text-fg">
                  {review.product.name}
                </Link>
                {" · "}
              </>
            )}
            <time dateTime={review.created_at}>{formatDate(review.created_at)}</time>
          </span>
        </div>
      </div>
    </Card>
  );
}

function CustomerReviews() {
  const uid = useId();
  const { data: sections } = useHomeSections();
  const section = sections?.find((s) => s.key === "reviews");
  const configured = Number(section?.config?.limit);
  const limit = configured > 0 ? Math.min(Math.floor(configured), MAX_LIMIT) : DEFAULT_LIMIT;

  const { data: reviews, isPending, isError } = useRecentReviews(limit);
  const { data: summary } = useReviewSummary();

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

  // Nothing to show and nothing loading: omit the section rather than an empty band.
  if (!isPending && !reviews?.length && !isError) return null;
  if (isError && !reviews) return null;

  return (
    <section aria-labelledby={`${uid}-title`} className="section-ivory py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow={section?.title || strings.reviews.eyebrow}
          title={section?.subtitle || strings.reviews.title}
          id={`${uid}-title`}
        />

        {summary?.count > 0 && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-h1 tabular-nums text-fg">
              <RollingNumber value={summary.average.toFixed(1)} />
            </p>
            <Rating value={summary.average} showValue={false} />
            <p className="text-small text-muted">{strings.reviews.summary(summary.count)}</p>
          </div>
        )}

        <Reveal className="flex flex-col gap-4">
          <div ref={viewportRef} className="overflow-hidden" role="region" aria-roledescription="carousel" aria-label={strings.reviews.carouselLabel}>
            <ul className="flex" aria-busy={isPending ? "true" : undefined}>
              {isPending
                ? Array.from({ length: 3 }, (_, i) => (
                    <li key={i} className={SLIDE}>
                      <Skeleton className="h-56 w-full rounded-card" />
                    </li>
                  ))
                : reviews.map((review) => (
                    <li key={review.id} className={SLIDE}>
                      <ReviewCard review={review} />
                    </li>
                  ))}
            </ul>
          </div>
          {(canPrev || canNext) && (
            <div className="hidden items-center justify-end gap-2 md:flex">
              <IconButton label={strings.reviews.prev} disabled={!canPrev} onClick={() => embla?.scrollPrev(prefersReducedMotion())}>
                <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} />
              </IconButton>
              <IconButton label={strings.reviews.next} disabled={!canNext} onClick={() => embla?.scrollNext(prefersReducedMotion())}>
                <ChevronRight aria-hidden="true" size={20} strokeWidth={1.5} />
              </IconButton>
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  );
}

export default CustomerReviews;
