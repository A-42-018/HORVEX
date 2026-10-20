import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Button, Card, Input, Skeleton } from "../../components/common";
import { strings } from "../strings";
import BlockModal from "../components/customers/BlockModal";
import { CustomerCards, CustomerTable } from "../components/customers/CustomerRows";
import { CUSTOMER_VIEWS, readCustomerFilters } from "../components/customers/customerRules";
import ExportButton from "../components/export/ExportButton";
import { useAdminCustomers } from "../hooks/useCustomerAdmin";
import { useExportCustomers } from "../hooks/useExport";
import { useSearchDraft } from "../hooks/useSearchDraft";

const t = strings.admin.customers;
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

function ViewTabs({ active, onSelect }) {
  return (
    <div role="group" aria-label={t.views.label} className="flex flex-wrap gap-2">
      {CUSTOMER_VIEWS.map((view) => {
        const on = view === active;
        return (
          <button
            key={view}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(view)}
            className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-pill border px-4 text-small font-semibold transition-colors duration-fast ${focusRing} ${
              on ? "border-gold bg-gold text-obsidian" : "border-line text-fg hover:border-brand"
            }`}
          >
            {t.views[view]}
          </button>
        );
      })}
    </div>
  );
}

function Customers() {
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState(null); // { customer, mode }
  const [notice, setNotice] = useState("");
  const filters = useMemo(() => readCustomerFilters(params), [params]);
  const exportCustomers = useExportCustomers();

  const { data, isPending, isError, isFetching, isFetchingNextPage, hasNextPage, more, refetch } = useAdminCustomers(filters);

  const setFilter = (key, value) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== "all") next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
    setNotice("");
  };
  // Typing updates the box at once; the URL and the query follow after a pause.
  const [search, setSearch] = useSearchDraft(filters.q, (value) => setFilter("q", value));

  const items = data?.items ?? [];
  const nothingAtAll = data && data.total === 0 && !filters.q && filters.view === "all";
  const noBlocked = data && data.total === 0 && !filters.q && filters.view === "blocked";

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | WRISTORY Admin`}</title>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title text-fg">{t.title}</h1>
          <p className="text-small text-muted">{data ? t.count(data.total) : t.intro}</p>
        </div>
        <ExportButton mutation={exportCustomers} copy={t.export} filters={filters} disabled={nothingAtAll || noBlocked} />
      </div>
      {data && <p className="-mt-3 text-small text-muted">{t.intro}</p>}

      <div role="search" aria-label={t.filters.label} className="grid gap-3 sm:max-w-md">
        <Input
          type="search"
          label={t.filters.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          maxLength={40}
        />
      </div>

      <ViewTabs active={filters.view} onSelect={(view) => setFilter("view", view)} />

      <p role="status" className="min-h-5 text-small text-muted">
        {notice}
      </p>

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
            {filters.q && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setFilter("q", "");
                }}
              >
                {t.filters.clear}
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <Card className="admin-empty flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-body text-fg">{nothingAtAll ? t.empty.none : noBlocked ? t.empty.blocked : t.empty.matches}</p>
              {(nothingAtAll || noBlocked) && <p className="text-small text-muted">{nothingAtAll ? t.empty.noneHint : t.empty.blockedHint}</p>}
            </Card>
          ) : (
            <Card as="section" aria-label={t.title} className="overflow-hidden">
              <CustomerTable
                customers={items}
                onBlock={(customer) => setDialog({ customer, mode: "block" })}
                onUnblock={(customer) => setDialog({ customer, mode: "unblock" })}
              />
              <CustomerCards
                customers={items}
                onBlock={(customer) => setDialog({ customer, mode: "block" })}
                onUnblock={(customer) => setDialog({ customer, mode: "unblock" })}
              />
            </Card>
          )}

          {hasNextPage && (
            <Button variant="secondary" size="sm" className="self-center" loading={isFetchingNextPage} onClick={more}>
              {t.filters.more}
            </Button>
          )}
        </>
      )}

      {dialog && (
        <BlockModal customer={dialog.customer} mode={dialog.mode} onClose={() => setDialog(null)} onDone={setNotice} />
      )}
    </div>
  );
}

export default Customers;
