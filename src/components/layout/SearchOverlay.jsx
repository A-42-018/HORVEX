import { useId, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, X } from "lucide-react";
import DialogShell from "../common/DialogShell";
import Price from "../common/Price";
import Skeleton from "../common/Skeleton";
import { useProductSearch } from "../../hooks/useCatalog";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { SEARCH_MIN_CHARS } from "../../services/products";
import { EVENTS, track } from "../../lib/analytics";
import { strings } from "../../lib/strings";
import { useRecentSearches } from "../../store/recentSearches";
import { useUI } from "../../store/ui";

const s = strings.search;
const FULL_SCREEN = (visible) =>
  `fixed inset-0 transition-opacity duration-slow ${visible ? "opacity-100" : "opacity-0"}`;

const searchUrl = (term) => `/shop?search=${encodeURIComponent(term)}`;

function ResultRow({ id, product, active, onSelect, onHover }) {
  const image = product.images.find((i) => !i.is_lifestyle) ?? product.images[0];
  return (
    <li role="presentation">
      <Link
        id={id}
        role="option"
        aria-selected={active}
        to={`/product/${product.slug}`}
        onClick={onSelect}
        onMouseMove={onHover}
        tabIndex={-1}
        className={`flex items-center gap-4 rounded-card px-3 py-2 transition-colors duration-fast ${
          active ? "bg-surface" : ""
        }`}
      >
        <span className="h-[3.75rem] w-12 shrink-0 overflow-hidden rounded-card bg-surface">
          {image && <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          {product.category?.name && (
            <span className="truncate text-eyebrow text-muted">{product.category.name}</span>
          )}
          <span className="truncate text-body font-medium text-fg">{product.name}</span>
        </span>
        <Price amount={product.price} compareAt={product.compare_at_price} size="sm" className="shrink-0" />
      </Link>
    </li>
  );
}

const chipClass =
  "inline-flex min-h-11 items-center rounded-pill border border-line px-4 text-small text-fg transition-colors duration-fast hover:border-focus hover:text-brand";

function SearchPanel() {
  const navigate = useNavigate();
  const closeAll = useUI((state) => state.closeAll);
  const listId = useId();
  const [term, setTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const recent = useRecentSearches((state) => state.terms);
  const addRecent = useRecentSearches((state) => state.add);
  const removeRecent = useRecentSearches((state) => state.remove);
  const clearRecent = useRecentSearches((state) => state.clear);

  const debounced = useDebouncedValue(term, 250);
  const clean = term.trim();
  const ready = clean.length >= SEARCH_MIN_CHARS;
  const { data, isFetching, isError, refetch } = useProductSearch(debounced);
  // Results lag the input by the debounce, so treat the gap as loading.
  const pending = ready && (isFetching || debounced.trim() !== clean);
  const items = ready ? (data?.items ?? []) : [];
  const total = ready ? (data?.total ?? 0) : 0;
  const showEmpty = ready && !pending && !isError && items.length === 0;
  const optionId = (index) => `${listId}-option-${index}`;
  const hasViewAll = items.length > 0 && total > items.length;
  const rowCount = items.length + (hasViewAll ? 1 : 0);

  const record = () => {
    track(EVENTS.search, { search_term: clean });
    addRecent(clean);
  };

  const submit = () => {
    if (!ready) return;
    record();
    closeAll();
    navigate(searchUrl(clean));
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" && rowCount) {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % rowCount);
    } else if (event.key === "ArrowUp" && rowCount) {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? rowCount - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < items.length) {
        record();
        closeAll();
        navigate(`/product/${items[activeIndex].slug}`);
      } else {
        submit();
      }
    }
  };

  const status = pending ? s.loading : ready && !isError ? (items.length ? s.results(total) : s.empty(clean)) : "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6">
      <div className="relative">
        <Search
          aria-hidden="true"
          size={20}
          strokeWidth={1.5}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          data-autofocus
          type="search"
          role="combobox"
          aria-label={s.label}
          aria-expanded={rowCount > 0}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={s.placeholder}
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="block h-14 w-full rounded-control border border-control bg-raised pl-12 pr-4 text-body text-fg transition-colors duration-fast placeholder:text-muted focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>

      <p role="status" className="sr-only">
        {status}
      </p>

      {!ready && (
        <div className="flex flex-col gap-8">
          <p className="text-small text-muted">{s.hint}</p>

          {recent.length > 0 && (
            <section aria-labelledby={`${listId}-recent`} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 id={`${listId}-recent`} className="text-eyebrow text-muted">
                  {s.recent}
                </h3>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="min-h-11 px-2 text-small text-brand underline underline-offset-4"
                >
                  {s.clearRecent}
                </button>
              </div>
              <ul className="flex flex-wrap gap-2">
                {recent.map((term) => (
                  <li key={term} className="inline-flex items-center rounded-pill border border-line">
                    <button
                      type="button"
                      onClick={() => setTerm(term)}
                      className="min-h-11 pl-4 pr-2 text-small text-fg transition-colors duration-fast hover:text-brand"
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      aria-label={s.removeRecent(term)}
                      onClick={() => removeRecent(term)}
                      className="inline-flex h-11 w-11 items-center justify-center text-muted transition-colors duration-fast hover:text-fg"
                    >
                      <X aria-hidden="true" size={16} strokeWidth={1.5} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby={`${listId}-popular`} className="flex flex-col gap-3">
            <h3 id={`${listId}-popular`} className="text-eyebrow text-muted">
              {s.popular}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {s.popularTerms.map((term) => (
                <li key={term}>
                  <button type="button" onClick={() => setTerm(term)} className={chipClass}>
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {ready && pending && items.length === 0 && (
        <div aria-hidden="true" className="flex flex-col gap-2">
          {[0, 1, 2].map((n) => (
            <div key={n} className="flex items-center gap-4 px-3 py-2">
              <Skeleton className="h-[3.75rem] w-12 shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-1/4" rounded="rounded-control" />
                <Skeleton className="h-4 w-3/5" rounded="rounded-control" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-body text-muted">{s.error}</p>
          <button type="button" onClick={() => refetch()} className="text-button text-brand underline underline-offset-4">
            {strings.data.retry}
          </button>
        </div>
      )}

      {showEmpty && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-body text-fg">{s.empty(clean)}</p>
          <p className="text-small text-muted">{s.emptyHelp}</p>
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-eyebrow text-muted">{s.emptyBrowse}</p>
            <ul className="flex flex-wrap gap-2">
              {s.emptyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} onClick={closeAll} className={chipClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Link to="/shop" onClick={closeAll} className="text-button text-brand underline underline-offset-4">
            {s.browseAll}
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={s.label}
          className={`flex flex-col gap-1 transition-opacity duration-fast ${pending ? "opacity-60" : ""}`}
        >
          {items.map((product, index) => (
            <ResultRow
              key={product.id}
              id={optionId(index)}
              product={product}
              active={index === activeIndex}
              onSelect={() => {
                record();
                closeAll();
              }}
              onHover={() => setActiveIndex(index)}
            />
          ))}
          {hasViewAll && (
            <li role="presentation">
              <Link
                id={optionId(items.length)}
                role="option"
                aria-selected={activeIndex === items.length}
                to={searchUrl(clean)}
                tabIndex={-1}
                onClick={() => {
                  record();
                  closeAll();
                }}
                onMouseMove={() => setActiveIndex(items.length)}
                className={`block rounded-card px-3 py-3 text-button text-brand ${
                  activeIndex === items.length ? "bg-surface" : ""
                }`}
              >
                {s.viewAll(total, clean)}
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// Full-screen search (roadmap §5.3) on the shared DialogShell: ESC and the
// close button come from the shell. The panel remounts per open, so the term
// resets. Idle state: recent searches (persisted) + popular chips.
function SearchOverlay() {
  const open = useUI((state) => state.searchOpen);
  const closeAll = useUI((state) => state.closeAll);
  return (
    <DialogShell open={open} onClose={closeAll} title={s.title} tone="dark" panelClass={FULL_SCREEN}>
      <SearchPanel />
    </DialogShell>
  );
}

export default SearchOverlay;
