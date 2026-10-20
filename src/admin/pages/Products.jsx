import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Plus } from "lucide-react";
import { Button, Card, Input, Select, Skeleton } from "../../components/common";
import { strings } from "../../lib/strings";
import { ProductCards, ProductTable } from "../components/products/ProductRows";
import {
  NO_CATEGORY,
  SORTS,
  STATUSES,
  STOCK_FILTERS,
  categoryOptions,
  filterProducts,
} from "../components/products/productFilters";
import { useAdminProducts, useUpdateProduct } from "../hooks/useAdminProducts";

const t = strings.admin.products;
const PAGE_SIZE = 25;
const FILTER_KEYS = ["q", "status", "category", "stock"];

const labelled = (keys, labels) => keys.map((value) => ({ value, label: labels[value] }));

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );
}

function Products() {
  const { data, isPending, isError, refetch } = useAdminProducts();
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [announcement, setAnnouncement] = useState("");
  const [failure, setFailure] = useState("");

  const update = useUpdateProduct({
    onSaved: () => setFailure(""),
    onFailed: ({ product }) => {
      setAnnouncement("");
      setFailure(t.saveFailed(product.name));
    },
  });

  // Filters live in the URL so a refresh or a shared link keeps the view.
  const filters = useMemo(
    () => ({
      q: params.get("q") ?? "",
      status: STATUSES.includes(params.get("status")) ? params.get("status") : "",
      category: params.get("category") ?? "",
      stock: STOCK_FILTERS.includes(params.get("stock")) ? params.get("stock") : "",
      sort: SORTS.includes(params.get("sort")) ? params.get("sort") : "newest",
    }),
    [params],
  );
  const hasFilters = FILTER_KEYS.some((key) => filters[key]);

  const setFilter = (key, value) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && !(key === "sort" && value === "newest")) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
    setVisible(PAGE_SIZE);
  };

  const clearFilters = () => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        FILTER_KEYS.forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );
    setVisible(PAGE_SIZE);
  };

  const items = data?.items;
  const categories = useMemo(() => (items ? categoryOptions(items) : []), [items]);
  const results = useMemo(() => (items ? filterProducts(items, filters) : []), [items, filters]);
  const shown = results.slice(0, visible);

  const onChange = (product, patch, message) => {
    setFailure("");
    setAnnouncement(message);
    update.mutate({ product, patch });
  };

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | HORVEX Admin`}</title>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h3 text-fg">{t.title}</h1>
          {items && <p className="text-small text-muted">{t.count(items.length)}</p>}
        </div>
        <Button as={Link} to="/admin/products/new" size="sm" className="gap-2">
          <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
          {t.newProduct}
        </Button>
      </div>

      {isPending && <ListSkeleton />}

      {isError && !data && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      )}

      {data && (
        <>
          {data.truncated && <p className="text-small text-warning">{t.truncated}</p>}

          <div role="search" aria-label={t.filters.label} className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <Input
              type="search"
              label={t.filters.search}
              value={filters.q}
              onChange={(event) => setFilter("q", event.target.value)}
              className="col-span-2"
            />
            <Select
              label={t.filters.status}
              placeholder={null}
              value={filters.status}
              onChange={(event) => setFilter("status", event.target.value)}
              options={[{ value: "", label: t.filters.all }, ...labelled(STATUSES, t.status)]}
            />
            <Select
              label={t.filters.category}
              placeholder={null}
              value={filters.category}
              onChange={(event) => setFilter("category", event.target.value)}
              options={[
                { value: "", label: t.filters.allCategories },
                ...categories,
                { value: NO_CATEGORY, label: t.filters.noCategory },
              ]}
            />
            <Select
              label={t.filters.stock}
              placeholder={null}
              value={filters.stock}
              onChange={(event) => setFilter("stock", event.target.value)}
              options={[{ value: "", label: t.filters.all }, ...labelled(STOCK_FILTERS, t.stock)]}
            />
            <Select
              label={t.filters.sort}
              placeholder={null}
              value={filters.sort}
              onChange={(event) => setFilter("sort", event.target.value)}
              options={labelled(SORTS, t.sorts)}
            />
          </div>

          <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
            <p className="text-small text-muted">{t.filters.showing(shown.length, results.length)}</p>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t.filters.clear}
              </Button>
            )}
          </div>

          <p role="status" className="sr-only">
            {announcement}
          </p>
          {failure && (
            <p role="alert" className="text-small text-danger">
              {failure}
            </p>
          )}

          {results.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-body text-fg">{items.length === 0 ? t.empty.none : t.empty.matches}</p>
              {items.length === 0 ? (
                <p className="text-small text-muted">{t.empty.noneHint}</p>
              ) : (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  {t.filters.clear}
                </Button>
              )}
            </Card>
          ) : (
            <Card as="section" aria-label={t.title} className="overflow-hidden">
              <ProductTable products={shown} onChange={onChange} />
              <ProductCards products={shown} onChange={onChange} />
            </Card>
          )}

          {results.length > shown.length && (
            <Button variant="secondary" size="sm" className="self-center" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
              {t.filters.more}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export default Products;
