import { useEffect } from "react";
import { Link } from "react-router";
import { Heart, X } from "lucide-react";
import { Button, Container, SectionHeading } from "../components/common";
import ProductCard from "../components/home/ProductCard";
import ProductGrid, { ProductCardSkeleton } from "../components/product/ProductGrid";
import { useProducts, useProductsByIds } from "../hooks/useCatalog";
import { addToBag } from "../lib/cartActions";
import { strings } from "../lib/strings";
import { Seo } from "../components/seo";
import { useWishlist } from "../store/wishlist";

// Same columns as ProductGrid.
const GRID = "grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4";
const copy = strings.wishlist;

// One saved watch: the shared card plus Move to bag / Remove. Watches with
// options go to the PDP (a variant has to be chosen); sold-out ones can't move.
function WishlistItem({ product, onMove, onRemove }) {
  const hasOptions = product.variants?.length > 0;
  const soldOut = product.stock < 1;

  return (
    <div className="flex flex-col gap-3">
      <ProductCard product={product} />
      {soldOut ? (
        <Button size="sm" variant="secondary" disabled className="w-full">
          {strings.badge.soldOut}
        </Button>
      ) : hasOptions ? (
        <Button as={Link} to={`/product/${product.slug}`} size="sm" className="w-full">
          {strings.product.chooseOptions}
        </Button>
      ) : (
        <Button size="sm" className="w-full" onClick={() => onMove(product)} aria-label={copy.moveNamed(product.name)}>
          {copy.moveToBag}
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="w-full"
        onClick={() => onRemove(product.id)}
        aria-label={copy.removeNamed(product.name)}
      >
        <X aria-hidden="true" size={16} strokeWidth={1.5} />
        {copy.remove}
      </Button>
    </div>
  );
}

function EmptyState() {
  const bestSellers = useProducts({ bestseller: true, sort: "bestselling", limit: 4 });
  return (
    <>
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <Heart aria-hidden="true" size={40} strokeWidth={1.5} className="text-muted" />
        <h2 className="text-h3 text-fg">{copy.emptyTitle}</h2>
        <p className="max-w-sm text-body text-muted">{copy.emptyText}</p>
        <Button as={Link} to="/shop" variant="secondary">{copy.browse}</Button>
      </div>
      <section aria-labelledby="wishlist-best-heading" className="mt-10 lg:mt-16">
        <SectionHeading id="wishlist-best-heading" title={copy.bestSellers} align="left" action={{ to: "/shop" }} />
        <div className="mt-8 lg:mt-10">
          <ProductGrid query={bestSellers} skeletons={4} label={copy.bestSellersLabel} reveal={false} />
        </div>
      </section>
    </>
  );
}

function Wishlist() {
  const ids = useWishlist((s) => s.ids);
  const remove = useWishlist((s) => s.remove);
  const clear = useWishlist((s) => s.clear);
  const { data, isPending, isError, isFetching, isPlaceholderData, refetch } = useProductsByIds(ids);

  // Only trust `data` for ids still saved (keepPreviousData can lag a removal).
  const items = (data ?? []).filter((p) => ids.includes(p.id));

  // Drop saved ids that no longer exist / aren't active, once a fresh load has settled.
  useEffect(() => {
    if (!data || isPlaceholderData || isFetching || isError) return;
    const found = new Set(data.map((p) => p.id));
    ids.filter((id) => !found.has(id)).forEach(remove);
  }, [data, ids, isPlaceholderData, isFetching, isError, remove]);

  const moveToBag = (product) => {
    if (addToBag(product).ok) remove(product.id);
  };

  let body;
  if (!ids.length || (!isPending && !isError && !items.length && !isFetching)) {
    body = <EmptyState />;
  } else if (isPending && !data?.length) {
    body = (
      <div className={GRID} aria-busy="true" aria-label={copy.listLabel}>
        {ids.slice(0, 8).map((id) => <ProductCardSkeleton key={id} />)}
      </div>
    );
  } else if (isError && !data?.length) {
    body = (
      <div className="flex flex-col items-center gap-4 text-center" role="alert">
        <p className="text-body text-muted">{strings.data.loadError}</p>
        <Button variant="secondary" size="sm" loading={isFetching} onClick={() => refetch()}>
          {strings.data.retry}
        </Button>
      </div>
    );
  } else {
    body = (
      <>
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-body text-muted" aria-live="polite">{copy.count(items.length)}</p>
          <Button size="sm" variant="ghost" onClick={clear}>{copy.clearAll}</Button>
        </div>
        <ul className={GRID} aria-label={copy.listLabel}>
          {items.map((product) => (
            <li key={product.id}>
              <WishlistItem product={product} onMove={moveToBag} onRemove={remove} />
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <Container className="py-section-sm lg:py-section">
      <Seo title={copy.title} noindex />
      <SectionHeading as="h1" eyebrow={copy.eyebrow} title={copy.title} align="left" className="mb-10" />
      {body}
    </Container>
  );
}

export default Wishlist;
