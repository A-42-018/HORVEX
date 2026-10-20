import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import { Button, Container, SectionHeading } from "../common";
import { ProductGrid } from "../product";
import { useProducts } from "../../hooks/useCatalog";
import { useHomeSections } from "../../hooks/useContent";
import { strings } from "../../lib/strings";

const DEFAULT_LIMIT = 8;
const DEFAULT_TABS = ["bestsellers", "new", "sale"];

// Tab key → listProducts() filters.
const FILTERS = {
  bestsellers: { bestseller: true },
  new: { sort: "newest" },
  sale: { onSale: true },
};

// One query per tab, all started on mount, so switching tabs shows cached
// data instantly (no refetch flicker). Only the active tab renders a grid.
function useTabQueries(keys, limit) {
  const bestsellers = useProducts({ ...FILTERS.bestsellers, limit });
  const fresh = useProducts({ ...FILTERS.new, limit });
  const sale = useProducts({ ...FILTERS.sale, limit });
  const all = { bestsellers, new: fresh, sale };
  return Object.fromEntries(keys.map((k) => [k, all[k]]));
}

// "Featured" home section: Best Sellers / New Arrivals / On Sale.
// Heading, tab labels and limit come from `home_sections.featured`
// (config.tabs / config.limit), falling back to strings.featured.
function FeaturedTabs() {
  const { data: sections } = useHomeSections();
  const section = sections?.find((s) => s.key === "featured");
  const limit = Number(section?.config?.limit) > 0 ? Number(section.config.limit) : DEFAULT_LIMIT;

  const configured = Array.isArray(section?.config?.tabs) ? section.config.tabs : [];
  const tabs = (configured.length ? configured : DEFAULT_TABS.map((key) => ({ key })))
    .filter((t) => FILTERS[t.key])
    .map((t) => ({ key: t.key, label: t.label || strings.featured.tabs[t.key] }));

  const keys = tabs.map((t) => t.key);
  const queries = useTabQueries(keys, limit);

  const [selected, setSelected] = useState(null);
  const active = keys.includes(selected) ? selected : keys[0];
  const uid = useId();
  const tabRefs = useRef({});

  if (!tabs.length) return null;

  const onKeyDown = (event) => {
    const i = keys.indexOf(active);
    const next =
      event.key === "ArrowRight" ? (i + 1) % keys.length
      : event.key === "ArrowLeft" ? (i - 1 + keys.length) % keys.length
      : event.key === "Home" ? 0
      : event.key === "End" ? keys.length - 1
      : null;
    if (next == null) return;
    event.preventDefault();
    setSelected(keys[next]);
    tabRefs.current[keys[next]]?.focus();
  };

  return (
    <section aria-labelledby={`${uid}-title`} className="section-ivory py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow={section?.title || strings.featured.eyebrow}
          title={section?.subtitle || strings.featured.title}
          id={`${uid}-title`}
        />

        <div
          role="tablist"
          aria-label={strings.featured.tabsLabel}
          onKeyDown={onKeyDown}
          className="-mx-gutter flex justify-start gap-2.5 overflow-x-auto px-gutter pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
        >
          {tabs.map((tab) => {
            const isActive = tab.key === active;
            return (
              <button
                key={tab.key}
                ref={(el) => (tabRefs.current[tab.key] = el)}
                id={`${uid}-tab-${tab.key}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`${uid}-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setSelected(tab.key)}
                className={`min-h-11 shrink-0 rounded-full border px-5 py-2 text-button transition-colors duration-fast ${
                  isActive
                    ? "border-fg bg-fg text-on-fg"
                    : "border-line text-muted hover:border-fg/40 hover:text-fg"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${active}`} tabIndex={0}>
          <ProductGrid
            key={active}
            query={queries[active]}
            skeletons={limit}
            label={tabs.find((t) => t.key === active).label}
            emptyMessage={strings.featured.empty[active]}
            reveal={false}
          />
        </div>

        <div className="flex justify-center">
          <Button as={Link} to="/shop" variant="secondary" size="lg">
            {strings.featured.viewAll}
          </Button>
        </div>
      </Container>
    </section>
  );
}

export default FeaturedTabs;
