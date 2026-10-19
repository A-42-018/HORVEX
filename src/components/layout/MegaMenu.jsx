import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Skeleton } from "../common";
import { useCategories, useCollections } from "../../hooks/useCatalog";
import { strings } from "../../lib/strings";

const STRAP_SLUGS = ["chain", "leather"];
// Men and Women have their own header links, so the menu skips them.
const TOP_LEVEL_SLUGS = ["men", "women"];
const HOVER_CLOSE_DELAY = 120;

const PRICE_LINKS = [
  { to: "/shop?price_max=2999", label: strings.mega.prices.under2999 },
  { to: "/shop?price_max=4999", label: strings.mega.prices.under4999 },
  { to: "/shop?price_min=5000", label: strings.mega.prices.over4999 },
];

function MenuLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group/link inline-flex min-h-11 items-center gap-2 text-small text-fg transition-colors duration-fast hover:text-brand focus-visible:text-brand"
    >
      <span
        aria-hidden="true"
        className="h-px w-0 bg-gold transition-[width] duration-base group-hover/link:w-4 group-focus-visible/link:w-4"
      />
      {children}
    </Link>
  );
}

function Column({ title, children }) {
  return (
    <div>
      <p className="text-eyebrow">{title}</p>
      <ul className="mt-3">{children}</ul>
    </div>
  );
}

function FeaturedCard({ collection }) {
  if (!collection) return null;
  return (
    <Link
      to={`/collection/${collection.slug}`}
      className="group/card relative block aspect-[4/5] overflow-hidden rounded-card bg-surface"
    >
      {collection.banner && (
        <img
          src={collection.banner}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-reveal ease-out-expo group-hover/card:scale-105"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-vignette" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-eyebrow">{strings.mega.featured}</p>
        <p className="mt-2 flex items-center justify-between gap-2 text-h3 text-ivory">
          {collection.title}
          <ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-gold" />
        </p>
      </div>
    </Link>
  );
}

// "Collections" trigger + panel for the desktop header (roadmap §5.3).
// Opens on hover and on click / Enter / Space; ESC and focus leaving close it.
// `onOpenChange` lets the header force its solid background while open.
function MegaMenu({ onOpenChange, headerHidden }) {
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();
  const panelId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const closeTimer = useRef(0);

  const categories = useCategories();
  const collections = useCollections();

  const set = useCallback(
    (value) => {
      clearTimeout(closeTimer.current);
      setOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange],
  );

  // Close after navigating or when the header slides away.
  useEffect(() => set(false), [pathname, search, set]);
  useEffect(() => {
    if (headerHidden) set(false);
  }, [headerHidden, set]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const onKeyDown = (event) => {
    if (event.key !== "Escape" || !open) return;
    event.stopPropagation();
    set(false);
    triggerRef.current?.focus();
  };

  const onBlur = (event) => {
    if (!rootRef.current?.contains(event.relatedTarget)) set(false);
  };

  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => set(false), HOVER_CLOSE_DELAY);
  };

  const cats = (categories.data ?? []).filter((c) => !TOP_LEVEL_SLUGS.includes(c.slug));
  const straps = cats.filter((c) => STRAP_SLUGS.includes(c.slug));
  const styles = cats.filter((c) => !STRAP_SLUGS.includes(c.slug));
  const featured = (collections.data ?? []).find((c) => c.banner) ?? null;
  const loading = categories.isPending || collections.isPending;
  const hasMenu = styles.length > 0 || straps.length > 0;

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => set(true)}
      onMouseLeave={scheduleClose}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => set(!open)}
        className={`inline-flex min-h-11 items-center gap-1.5 text-button transition-colors duration-fast hover:text-brand focus-visible:text-brand ${
          open ? "text-brand" : "text-fg"
        }`}
      >
        {strings.nav.collections}
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          aria-hidden="true"
          className={`transition-transform duration-base ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Stays mounted so it can fade; `invisible` keeps it out of the tab order while closed. */}
      <div
        id={panelId}
        role="region"
        aria-label={strings.mega.label}
        aria-busy={loading}
        className={`absolute inset-x-0 top-full rounded-b-card border border-t-0 border-line bg-obsidian shadow-highlight transition-[opacity,visibility,transform] duration-base before:absolute before:inset-x-0 before:-top-6 before:h-6 ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <div className="grid grid-cols-[1fr_1fr_1fr_minmax(0,18rem)] gap-10 p-10">
            {loading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                ))}
                <Skeleton className="aspect-[4/5]" />
              </>
            ) : (
              <>
                {hasMenu ? (
                  <>
                    <Column title={strings.mega.byStyle}>
                      {styles.map((c) => (
                        <li key={c.id}>
                          <MenuLink to={`/category/${c.slug}`}>{c.name}</MenuLink>
                        </li>
                      ))}
                    </Column>
                    <Column title={strings.mega.byStrap}>
                      {straps.map((c) => (
                        <li key={c.id}>
                          <MenuLink to={`/category/${c.slug}`}>{c.name}</MenuLink>
                        </li>
                      ))}
                    </Column>
                  </>
                ) : (
                  <p className="col-span-2 text-small text-muted">{strings.mega.empty}</p>
                )}
                <Column title={strings.mega.byPrice}>
                  {PRICE_LINKS.map((l) => (
                    <li key={l.to}>
                      <MenuLink to={l.to}>{l.label}</MenuLink>
                    </li>
                  ))}
                  <li className="mt-2 border-t border-line pt-2">
                    <MenuLink to="/shop">{strings.mega.shopAll}</MenuLink>
                  </li>
                </Column>
                <FeaturedCard collection={featured} />
              </>
            )}
        </div>
      </div>
    </div>
  );
}

export default MegaMenu;
