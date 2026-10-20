import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Plus, Trash2, X } from "lucide-react";
import { Button, Card, Input, Select, Skeleton } from "../../components/common";
import { strings } from "../strings";
import { ProductCards, ProductTable, SelectBox } from "../components/products/ProductRows";
import ProductRemoveDialog from "../components/products/ProductRemoveDialog";
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
  const [selected, setSelected] = useState(() => new Set());
  const [removing, setRemoving] = useState(false);
  // Frozen when the dialog opens, so its text doesn't change while it closes.
  const [removeList, setRemoveList] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  // A removal from the editor lands here with its summary.
  const [notice, setNotice] = useState(location.state?.removed ?? "");
  // Drop it from history so a reload doesn't show it again.
  useEffect(() => {
    if (location.state?.removed) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

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
    setSelected(new Set());
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
    setSelected(new Set());
  };

  const items = data?.items;
  const categories = useMemo(() => (items ? categoryOptions(items) : []), [items]);
  const results = useMemo(() => (items ? filterProducts(items, filters) : []), [items, filters]);
  const shown = results.slice(0, visible);

  // Only products still in the list count (a removed one drops out on refetch).
  const selectedProducts = useMemo(() => (items ?? []).filter((item) => selected.has(item.id)), [items, selected]);
  const shownSelected = shown.filter((item) => selected.has(item.id)).length;
  const selection = {
    has: (id) => selected.has(id),
    all: shown.length > 0 && shownSelected === shown.length,
    some: shownSelected > 0,
    toggle: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    toggleAll: (on) => setSelected(on ? new Set(shown.map((item) => item.id)) : new Set()),
  };

  const onRemoved = ({ deleted, archived }) => {
    setRemoving(false);
    setSelected(new Set());
    setNotice(t.remove.done(deleted.length, archived.length));
  };

  const onChange = (product, patch, message) => {
    setFailure("");
    setNotice("");
    setAnnouncement(message);
    update.mutate({ product, patch });
  };

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | WRISTORY Admin`}</title>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-fg">{t.title}</h1>
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

          <div role="search" aria-label={t.filters.label} className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-6">
            <Input
              type="search"
              label={t.filters.search}
              value={filters.q}
              onChange={(event) => setFilter("q", event.target.value)}
              className="col-span-2 md:col-span-4 2xl:col-span-2"
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
            <div className="flex items-center gap-1">
              {/* Cards have no header row, so select-all lives here below xl. */}
              {shown.length > 0 && (
                <span className="-ml-3 flex items-center xl:hidden">
                  <SelectBox
                    checked={selection.all}
                    indeterminate={selection.some && !selection.all}
                    onChange={selection.toggleAll}
                    label={t.select.all}
                  />
                  <span aria-hidden="true" className="text-small text-fg">
                    {t.select.allShort} ·
                  </span>
                </span>
              )}
              <p className="text-small text-muted">{t.filters.showing(shown.length, results.length)}</p>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t.filters.clear}
              </Button>
            )}
          </div>

          <p role="status" className="sr-only">
            {announcement}
          </p>
          {notice && (
            <p role="status" className="text-small text-positive">
              {notice}
            </p>
          )}
          {failure && (
            <p role="alert" className="text-small text-danger">
              {failure}
            </p>
          )}

          {results.length === 0 ? (
            <Card className="admin-empty flex flex-col items-center gap-3 px-6 py-12 text-center">
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
              <ProductTable products={shown} onChange={onChange} selection={selection} />
              <ProductCards products={shown} onChange={onChange} selection={selection} />
            </Card>
          )}

          {results.length > shown.length && (
            <Button variant="secondary" size="sm" className="self-center" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
              {t.filters.more}
            </Button>
          )}
        </>
      )}

      {selectedProducts.length > 0 && (
        // Floats above the mobile bottom bar (3.5rem + home-bar inset).
        <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 flex animate-route-enter items-center gap-2 rounded-card border border-line bg-raised px-3 py-2 shadow-surface lg:bottom-6">
          <p className="mr-auto pl-1 text-small font-semibold text-fg" aria-live="polite">
            {t.select.count(selectedProducts.length)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-3"
            aria-label={t.select.clearLabel}
            onClick={() => setSelected(new Set())}
          >
            <X aria-hidden="true" size={16} strokeWidth={1.5} />
            {t.select.clear}
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="gap-2"
            onClick={() => {
              setRemoveList(selectedProducts);
              setRemoving(true);
            }}
          >
            <Trash2 aria-hidden="true" size={16} strokeWidth={1.5} />
            {t.remove.delete}
          </Button>
        </div>
      )}

      <ProductRemoveDialog
        products={removeList}
        open={removing}
        onClose={() => setRemoving(false)}
        onDone={onRemoved}
      />
    </div>
  );
}

export default Products;
