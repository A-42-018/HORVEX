import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import { Check } from "lucide-react";
import { useProductReviews } from "../../hooks/useCatalog";
import { useDeliveryZones, useSiteSettings } from "../../hooks/useContent";
import ReviewsPanel from "./ReviewsPanel";
import { formatTaka } from "../../lib/format";
import { strings } from "../../lib/strings";

const SPEC_KEYS = Object.keys(strings.product.tabs.specLabels);

const humanize = (key) => key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const hasValue = (v) => v != null && String(v).trim() !== "";

// Known keys first in a fixed order, then any extra keys the admin added.
function specRows(specs) {
  if (!specs || typeof specs !== "object") return [];
  const labels = strings.product.tabs.specLabels;
  const keys = [...SPEC_KEYS, ...Object.keys(specs).filter((k) => !SPEC_KEYS.includes(k) && k !== "box_contents")];
  return keys
    .filter((k) => k !== "box_contents" && hasValue(specs[k]))
    .map((k) => ({ key: k, label: labels[k] ?? humanize(k), value: String(specs[k]) }));
}

const boxItems = (specs) =>
  hasValue(specs?.box_contents)
    ? String(specs.box_contents).split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
    : [];

function DescriptionPanel({ product }) {
  const text = hasValue(product.description) ? product.description : product.short_desc;
  const paragraphs = String(text ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="flex max-w-prose flex-col gap-4 text-body text-muted">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function SpecsPanel({ rows }) {
  return (
    <dl className="max-w-2xl divide-y divide-line border-y border-line">
      {rows.map(({ key, label, value }) => (
        <div key={key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3.5 text-small">
          <dt className="text-muted">{label}</dt>
          <dd className="font-medium text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DeliveryPanel() {
  const t = strings.product.tabs.delivery;
  const { data: zones } = useDeliveryZones();
  const { data: settings } = useSiteSettings();
  const threshold = settings?.free_delivery_threshold;

  return (
    <div className="grid max-w-4xl gap-10 md:grid-cols-2">
      <section aria-labelledby="pdp-delivery-h" className="flex flex-col gap-4">
        <h3 id="pdp-delivery-h" className="text-h3">{t.deliveryTitle}</h3>
        {zones?.length > 0 && (
          <ul className="divide-y divide-line border-y border-line">
            {zones.map((z) => (
              <li key={z.id ?? z.name} className="flex items-baseline justify-between gap-4 py-3.5 text-small">
                <span className="text-fg">
                  {z.name}
                  {z.eta_text && <span className="block text-muted">{z.eta_text}</span>}
                </span>
                <span className="font-medium tabular-nums text-fg">{formatTaka(z.charge)}</span>
              </li>
            ))}
          </ul>
        )}
        {threshold > 0 && <p className="text-small text-muted">{t.freeOver(formatTaka(threshold))}</p>}
        <p className="text-small text-muted">{t.cod}</p>
      </section>

      <section aria-labelledby="pdp-returns-h" className="flex flex-col gap-4">
        <h3 id="pdp-returns-h" className="text-h3">{t.returnsTitle}</h3>
        <ul className="flex flex-col gap-3 text-small text-muted">
          {t.returns.map((line) => (
            <li key={line} className="flex gap-3">
              <Check aria-hidden="true" size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brand" />
              {line}
            </li>
          ))}
        </ul>
        <Link to="/policy/returns-replacement" className="w-fit text-nav font-semibold underline underline-offset-4">
          {t.policyLink}
        </Link>
      </section>
    </div>
  );
}

function BoxPanel({ items }) {
  return (
    <ul className="grid max-w-2xl gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3.5 text-small text-fg">
          <Check aria-hidden="true" size={18} strokeWidth={1.5} className="shrink-0 text-brand" />
          {item}
        </li>
      ))}
    </ul>
  );
}

// Tabs with content only; Reviews is always present (empty state inside).
function ProductTabs({ product }) {
  const uid = useId();
  const tabRefs = useRef({});
  const rows = specRows(product.specs);
  const items = boxItems(product.specs);
  const { data: reviewData } = useProductReviews(product.id);
  const labels = { ...strings.product.tabs.labels, reviews: strings.product.tabs.reviews.tabLabel(reviewData?.count ?? 0) };

  const tabs = [
    hasValue(product.description) || hasValue(product.short_desc)
      ? { key: "description", content: <DescriptionPanel product={product} /> } : null,
    rows.length ? { key: "specs", content: <SpecsPanel rows={rows} /> } : null,
    { key: "delivery", content: <DeliveryPanel /> },
    items.length ? { key: "box", content: <BoxPanel items={items} /> } : null,
    { key: "reviews", content: <ReviewsPanel productId={product.id} /> },
  ].filter(Boolean);

  const [selected, setSelected] = useState(tabs[0].key);
  const active = tabs.some((t) => t.key === selected) ? selected : tabs[0].key;
  const keys = tabs.map((t) => t.key);

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
    <section aria-label={strings.product.tabs.label} className="mt-12 lg:mt-20">
      <div
        role="tablist"
        aria-label={strings.product.tabs.label}
        onKeyDown={onKeyDown}
        className="-mx-gutter flex gap-6 overflow-x-auto border-b border-line px-gutter sm:mx-0 sm:gap-10 sm:px-0"
      >
        {tabs.map(({ key }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              ref={(el) => (tabRefs.current[key] = el)}
              id={`${uid}-tab-${key}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`${uid}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setSelected(key)}
              className={`-mb-px min-h-11 shrink-0 border-b-2 py-3 text-button transition-colors duration-fast ${
                isActive ? "border-brand text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {labels[key]}
            </button>
          );
        })}
      </div>
      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${active}`} tabIndex={0} className="pt-8">
        {tabs.find((t) => t.key === active).content}
      </div>
    </section>
  );
}

export default ProductTabs;
