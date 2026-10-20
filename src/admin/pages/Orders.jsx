import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { Button, Card, Input, Skeleton } from "../../components/common";
import { strings } from "../strings";
import ExportButton from "../components/export/ExportButton";
import { OrderCards, OrderTable } from "../components/orders/OrderRows";
import { ORDER_STATUSES, hasExtraFilters, isBackwards, readFilters } from "../components/orders/orderFilters";
import { useExportOrders } from "../hooks/useExport";
import { useAdminOrderCounts, useAdminOrders } from "../hooks/useAdminOrders";
import { useSearchDraft } from "../hooks/useSearchDraft";

const t = strings.admin.orders;
const TABS = ["all", ...ORDER_STATUSES];
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}

function StatusTabs({ active, counts, onSelect }) {
  return (
    <div role="group" aria-label={t.tabs.label} className="-mx-gutter flex gap-2 overflow-x-auto px-gutter pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
      {TABS.map((tab) => {
        const on = (tab === "all" ? "" : tab) === active;
        const count = counts?.[tab];
        return (
          <button
            key={tab}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(tab === "all" ? "" : tab)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-pill border px-4 text-small font-semibold transition-colors duration-fast ${focusRing} ${
              on ? "border-gold bg-gold text-obsidian" : "border-line text-fg hover:border-brand"
            }`}
          >
            {t.tabs[tab]}
            {count != null && <span className={`tabular-nums ${on ? "" : "text-muted"}`}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Orders() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const backwards = isBackwards(filters);
  // A backwards range can't match anything: query with no date bounds is wrong too, so skip the date filters and warn.
  const effective = backwards ? { ...filters, from: "", to: "" } : filters;

  const { data, isPending, isError, isFetching, isFetchingNextPage, hasNextPage, more, refetch } = useAdminOrders(effective);
  const { data: counts } = useAdminOrderCounts(effective);
  const exportOrders = useExportOrders();

  const setFilter = (key, value) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };
  // Typing updates the box at once; the URL and the list + count queries follow after a pause.
  const [search, setSearch] = useSearchDraft(filters.q, (value) => setFilter("q", value));

  const clearFilters = () => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        ["q", "from", "to"].forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );
    setSearch("");
  };

  const items = data?.items ?? [];
  const extra = hasExtraFilters(filters);
  const nothingAtAll = data && data.total === 0 && !filters.status && !extra;

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | WRISTORY Admin`}</title>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title text-fg">{t.title}</h1>
          {counts && <p className="text-small text-muted">{t.count(counts.all)}</p>}
        </div>
        <ExportButton mutation={exportOrders} copy={t.export} filters={effective} disabled={nothingAtAll} />
      </div>

      <div role="search" aria-label={t.filters.label} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Input
          type="search"
          label={t.filters.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          maxLength={40}
          className="col-span-2"
        />
        <Input
          type="date"
          label={t.filters.from}
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => setFilter("from", event.target.value)}
        />
        <Input
          type="date"
          label={t.filters.to}
          value={filters.to}
          min={filters.from || undefined}
          onChange={(event) => setFilter("to", event.target.value)}
        />
      </div>
      {backwards && (
        <p role="alert" className="text-small text-danger">
          {t.filters.backwards}
        </p>
      )}

      <StatusTabs active={filters.status} counts={counts} onSelect={(status) => setFilter("status", status)} />

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
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-small text-muted">
              {isFetching ? t.filters.updating : t.filters.showing(items.length, data.total)}
            </p>
            {extra && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t.filters.clear}
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <Card className="admin-empty flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-body text-fg">{nothingAtAll ? t.empty.none : t.empty.matches}</p>
              {nothingAtAll ? (
                <p className="text-small text-muted">{t.empty.noneHint}</p>
              ) : (
                extra && (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    {t.filters.clear}
                  </Button>
                )
              )}
            </Card>
          ) : (
            <Card as="section" aria-label={t.title} className="overflow-hidden">
              <OrderTable orders={items} />
              <OrderCards orders={items} />
            </Card>
          )}

          {hasNextPage && (
            <Button variant="secondary" size="sm" className="self-center" loading={isFetchingNextPage} onClick={more}>
              {t.filters.more}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export default Orders;
