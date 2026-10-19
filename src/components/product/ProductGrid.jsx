import { Button, Reveal, Skeleton } from "../common";
import ProductCard from "../home/ProductCard";
import { strings } from "../../lib/strings";

// Same columns as every product listing. Keep in sync with nothing else:
// the skeleton and the loaded grid both use this one class string.
const GRID = "grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4";

// Mirrors ProductCard: 4:5 image, then category / name / price / swatch rows.
// Text rows use the card's own type classes and `h-[1lh]`, so they match the
// real line heights and nothing shifts when the data lands.
function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="flex flex-col gap-1.5 pt-4">
        <div className="text-badge"><Skeleton rounded="rounded-control" className="h-[1lh] w-1/4" /></div>
        <div className="text-body"><Skeleton rounded="rounded-control" className="h-[1lh] w-4/5" /></div>
        <div className="text-body"><Skeleton rounded="rounded-control" className="h-[1lh] w-2/5" /></div>
        <Skeleton rounded="rounded-full" className="h-3 w-12" />
      </div>
    </div>
  );
}

/**
 * Loading / error / empty / loaded states for a useProducts() result.
 * `skeletons` is the placeholder count while the first page loads (match
 * the query's `limit`). Refetches keep showing the previous items.
 */
function ProductGrid({ query, skeletons = 8, label, emptyMessage = strings.data.noProducts, reveal = true }) {
  const { data, isPending, isError, refetch, isFetching } = query;

  if (isPending) {
    return (
      <div className={GRID} aria-busy="true" aria-label={label}>
        {Array.from({ length: skeletons }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" role="alert">
        <p className="text-body text-muted">{strings.data.loadError}</p>
        <Button variant="secondary" size="sm" loading={isFetching} onClick={() => refetch()}>
          {strings.data.retry}
        </Button>
      </div>
    );
  }

  if (!data.items.length) {
    return <p className="text-center text-body text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className={GRID} aria-label={label} aria-busy={isFetching && !isPending ? "true" : undefined}>
      {data.items.map((product, i) => (
        <li key={product.id}>
          {reveal ? (
            <Reveal delay={(i % 4) * 80}>
              <ProductCard product={product} />
            </Reveal>
          ) : (
            <ProductCard product={product} />
          )}
        </li>
      ))}
    </ul>
  );
}

export { ProductCardSkeleton };
export default ProductGrid;
