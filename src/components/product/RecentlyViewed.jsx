import { SectionHeading } from "../common";
import ProductCard from "../home/ProductCard";
import { ProductCardSkeleton } from "./ProductGrid";
import { useProductsByIds } from "../../hooks/useCatalog";
import { useRecentlyViewed } from "../../store/recentlyViewed";
import { strings } from "../../lib/strings";

const SHOWN = 6;
const ITEM = "w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[22%]";

// Horizontal strip of the last watches opened (localStorage ids, newest first),
// excluding the one on screen. Hidden until there is something else to show.
function RecentlyViewed({ currentId }) {
  const ids = useRecentlyViewed((s) => s.ids);
  const others = ids.filter((id) => id !== currentId).slice(0, SHOWN);
  const { data, isPending, isError } = useProductsByIds(others);

  if (!others.length || isError) return null;
  if (!isPending && !data?.length) return null;

  const { recent } = strings.product;
  return (
    <section aria-labelledby="recent-heading" className="mt-16 lg:mt-24">
      <SectionHeading id="recent-heading" title={recent.title} align="left" />
      <ul
        aria-label={recent.label}
        className="mt-8 flex snap-x gap-4 overflow-x-auto pb-2 sm:gap-6 lg:mt-10"
      >
        {isPending
          ? others.slice(0, 4).map((id) => (
              <li key={id} className={ITEM}>
                <ProductCardSkeleton />
              </li>
            ))
          : data.map((product) => (
              <li key={product.id} className={ITEM}>
                <ProductCard product={product} />
              </li>
            ))}
      </ul>
    </section>
  );
}

export default RecentlyViewed;
