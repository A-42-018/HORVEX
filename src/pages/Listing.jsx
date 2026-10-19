import { useParams } from "react-router";
import { Button, Container } from "../components/common";
import { ProductGrid } from "../components/product";
import { ActiveChips, FilterPanel, ListingEmpty, ListingHeader, MobileFilters, SortSelect } from "../components/shop";
import NotFound from "./NotFound";
import { useCategory, useCollection, useCollectionProducts, useProducts } from "../hooks/useCatalog";
import { useListingParams } from "../hooks/useListingParams";
import { categoryScope } from "../services/products";
import { strings } from "../lib/strings";

// Result count for a draft filter set (mobile "Apply (n)"), per listing type.
const useShopTotal = (filters) => useProducts({ ...filters, limit: 1 }).data?.total;
const categoryTotal = (slug) => (filters) => useProducts({ ...filters, category: undefined, ...categoryScope(slug), limit: 1 }).data?.total;
const collectionTotal = (collection) => (filters) =>
  useCollectionProducts(collection, { filters, limit: 1 }).data?.total;

function ListingBody({ title, description, crumbs, query, view, useTotal, showCategory = false, showGender = true }) {
  const facets = { showCategory, showGender };
  const { data, isFetching } = query;
  const shown = data?.items.length ?? 0;
  const total = data?.total ?? 0;
  const isEmpty = data && !shown;

  return (
    <>
      <title>{`${title} | HORVEX`}</title>
      <ListingHeader title={title} description={description} crumbs={crumbs} count={data?.total} />
      <Container className="py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <h2 className="mb-4 text-h3 text-fg">{strings.listing.filters.title}</h2>
              <FilterPanel view={view} {...facets} />
            </div>
          </aside>
          <div className="min-w-0">
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-small text-muted" aria-live="polite">
                {data ? strings.listing.showing(shown, total) : ""}
              </p>
              <div className="flex items-center gap-3">
                <MobileFilters view={view} {...facets} useTotal={useTotal} />
                <SortSelect value={view.sort} onChange={view.setSort} />
              </div>
            </div>
            <ActiveChips view={view} {...facets} />
            {isEmpty ? (
              <ListingEmpty hasParams={view.hasFilters} onClear={view.clear} />
            ) : (
              <ProductGrid query={query} skeletons={8} label={title} reveal={false} />
            )}
            {data && shown < total && (
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-small text-muted">{strings.listing.showing(shown, total)}</p>
                <Button variant="secondary" loading={isFetching} onClick={view.loadMore}>
                  {strings.listing.loadMore}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}

export function Shop() {
  const view = useListingParams();
  const query = useProducts({ ...view.filters, sort: view.sort, limit: view.limit });
  return (
    <ListingBody
      title={strings.listing.shop}
      description={strings.listing.shopIntro}
      crumbs={[{ label: strings.listing.shop }]}
      query={query}
      view={view}
      useTotal={useShopTotal}
      showCategory
    />
  );
}

export function CategoryListing() {
  const { slug } = useParams();
  const category = useCategory(slug);
  const view = useListingParams();
  const scope = categoryScope(slug);
  const query = useProducts({ ...view.filters, category: undefined, ...scope, sort: view.sort, limit: view.limit });
  if (category.isPending) return <ListingSkeleton />;
  if (!category.data) return <NotFound />;
  return (
    <ListingBody
      title={category.data.name}
      description={category.data.description}
      crumbs={[{ label: strings.listing.shop, to: "/shop" }, { label: category.data.name }]}
      query={query}
      view={view}
      useTotal={categoryTotal(slug)}
      showGender={!scope.gender}
    />
  );
}

export function CollectionListing() {
  const { slug } = useParams();
  const collection = useCollection(slug);
  const view = useListingParams();
  const query = useCollectionProducts(collection.data, { filters: view.filters, sort: view.sort, limit: view.limit });
  if (collection.isPending) return <ListingSkeleton />;
  if (!collection.data) return <NotFound />;
  return (
    <ListingBody
      title={collection.data.title}
      description={collection.data.description}
      crumbs={[{ label: strings.listing.collections }, { label: collection.data.title }]}
      query={query}
      view={view}
      useTotal={collectionTotal(collection.data)}
    />
  );
}

function ListingSkeleton() {
  return <ProductGrid query={{ isPending: true }} label={strings.common.loading} />;
}
