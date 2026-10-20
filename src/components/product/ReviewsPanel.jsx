import { useState } from "react";
import { Button, Rating, Skeleton } from "../common";
import { useProductReviews } from "../../hooks/useCatalog";
import { responsiveImage } from "../../lib/images";
import { formatDate } from "../../lib/format";
import { strings } from "../../lib/strings";

const PAGE_SIZE = 5;

function Summary({ average, count, reviews }) {
  const t = strings.product.tabs.reviews;
  const counts = [5, 4, 3, 2, 1].map((stars) => ({ stars, n: reviews.filter((r) => r.rating === stars).length }));
  return (
    <div role="group" aria-label={t.summaryLabel} className="flex flex-col gap-6 sm:flex-row sm:items-center lg:flex-col lg:items-start">
      <div className="flex flex-col gap-2">
        <p className="text-h1 leading-none tabular-nums text-fg">{average.toFixed(1)}</p>
        <Rating value={average} showValue={false} />
        <p className="text-small text-muted">{t.basedOn(count)}</p>
      </div>
      <ul className="flex w-full max-w-xs flex-col gap-2">
        {counts.map(({ stars, n }) => (
          <li key={stars} aria-label={t.starRow(stars, n)} className="flex items-center gap-3 text-small tabular-nums text-muted">
            <span aria-hidden="true" className="w-3 text-fg">{stars}</span>
            <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <span className="block h-full rounded-full bg-brand" style={{ width: `${(n / count) * 100}%` }} />
            </span>
            <span aria-hidden="true" className="w-6 text-right">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewItem({ review }) {
  const photo = review.photo_url ? responsiveImage(review.photo_url, { aspect: [4, 3], widths: [240, 360, 480] }) : null;
  return (
    <li className="flex flex-col gap-3 py-6 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Rating value={review.rating} showValue={false} />
        <time dateTime={review.created_at} className="text-small text-muted">{formatDate(review.created_at)}</time>
      </div>
      {review.text && <p className="max-w-prose text-body text-fg">{review.text}</p>}
      {photo?.src && (
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={photo.srcSet ? "(min-width: 640px) 240px, 60vw" : undefined}
          alt={strings.product.tabs.reviews.photoAlt(review.name)}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-48 rounded-card object-cover sm:w-60"
        />
      )}
      <p className="text-small font-semibold text-fg">{review.name}</p>
    </li>
  );
}

// Approved reviews only (the query filters on status and RLS enforces it).
function ReviewsPanel({ productId }) {
  const t = strings.product.tabs.reviews;
  const { data, isPending, isError } = useProductReviews(productId);
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full max-w-prose" />
      </div>
    );
  }
  if (isError) return <p className="text-small text-muted">{t.error}</p>;
  if (!data.count) return <p className="text-body text-muted">{t.empty}</p>;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
      <Summary average={data.average} count={data.count} reviews={data.reviews} />
      <div className="flex flex-col gap-6">
        <ul aria-label={t.listLabel} className="divide-y divide-line">
          {data.reviews.slice(0, visible).map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
        {visible < data.count && (
          <Button variant="secondary" className="w-fit" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            {t.showMore}
          </Button>
        )}
      </div>
    </div>
  );
}

export default ReviewsPanel;
