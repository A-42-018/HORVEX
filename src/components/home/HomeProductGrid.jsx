import { Button, Reveal, Skeleton } from "../common";
import ProductCard from "./ProductCard";
import { strings } from "../../lib/strings";

const GRID = "grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4";

// Loading / error / empty / loaded states for a useProducts() result on the
// template home sections. B5's ProductGrid supersedes it.
function HomeProductGrid({ query, skeletons = 8, label }) {
  const { data, isPending, isError, refetch, isFetching } = query;

  if (isPending) {
    return (
      <div className={GRID} aria-busy="true" aria-label={label}>
        {Array.from({ length: skeletons }, (_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" role="alert">
        <p className="text-body text-ink-secondary">{strings.data.loadError}</p>
        <Button variant="secondary" size="sm" loading={isFetching} onClick={() => refetch()}>
          {strings.data.retry}
        </Button>
      </div>
    );
  }

  if (!data.items.length) {
    return <p className="text-center text-body text-ink-secondary">{strings.data.noProducts}</p>;
  }

  return (
    <div className={GRID}>
      {data.items.map((product, i) => (
        <Reveal key={product.id} delay={(i % 4) * 80}>
          <ProductCard product={product} />
        </Reveal>
      ))}
    </div>
  );
}

export default HomeProductGrid;
