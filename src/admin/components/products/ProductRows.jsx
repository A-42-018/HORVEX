import { Link } from "react-router";
import { Badge } from "../../../components/common";
import { formatTaka } from "../../../lib/format";
import { strings } from "../../strings";
import QuickToggle from "./QuickToggle";
import { stockState } from "./productFilters";

const t = strings.admin.products;
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";
const STATUS_BADGE = { active: "success", draft: "limited", archived: "neutral" };
const STOCK_TEXT = { in: "text-fg", low: "text-warning", out: "text-danger" };

function Thumb({ product }) {
  const { thumb } = product;
  return thumb ? (
    <img
      src={thumb.url}
      alt=""
      width={48}
      height={64}
      loading="lazy"
      decoding="async"
      className="h-16 w-12 shrink-0 rounded-control bg-raised object-cover"
    />
  ) : (
    <span className="flex h-16 w-12 shrink-0 items-center justify-center rounded-control bg-raised px-1 text-center text-badge text-muted">
      {t.table.noImage}
    </span>
  );
}

function Identity({ product }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Thumb product={product} />
      <div className="min-w-0">
        <Link
          to={`/admin/products/${product.id}`}
          aria-label={t.table.edit(product.name)}
          className={`block truncate rounded-control text-small font-semibold text-fg hover:text-brand ${focusRing}`}
        >
          {product.name}
        </Link>
        <p className="truncate text-small text-muted">
          {[product.sku, product.category?.name ?? t.table.uncategorised].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}

function PriceCell({ product }) {
  return (
    <>
      <span className="block text-small font-semibold tabular-nums text-fg">{formatTaka(product.price)}</span>
      {product.compare_at_price > product.price && (
        <s className="block text-small tabular-nums text-muted">{formatTaka(product.compare_at_price)}</s>
      )}
    </>
  );
}

function StockCell({ product }) {
  const state = stockState(product);
  return (
    <>
      <span className={`block text-small font-semibold tabular-nums ${STOCK_TEXT[state]}`}>
        {state === "out" ? t.stock.out : t.table.units(product.stock)}
      </span>
      {state === "low" && <span className="block text-small text-warning">{t.stock.low}</span>}
      {product.variantCount > 0 && <span className="block text-small text-muted">{t.table.variants(product.variantCount)}</span>}
    </>
  );
}

// `onChange(product, patch, announcement)` does the save; this only describes the change.
function toggleHandlers(product, onChange) {
  const flag = (key, label) => (on) =>
    onChange(product, { [key]: on }, t.saved(product.name, label.toLowerCase(), on));
  return {
    published: (on) =>
      onChange(product, { status: on ? "active" : "draft" }, t.savedStatus(product.name, t.status[on ? "active" : "draft"].toLowerCase())),
    featured: flag("is_featured", t.toggles.featured),
    bestseller: flag("is_bestseller", t.toggles.bestseller),
  };
}

/** md+: a real table with one row per product. */
export function ProductTable({ products, onChange }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[44rem] border-collapse text-left">
        <caption className="sr-only">{t.table.caption}</caption>
        <thead>
          <tr className="border-b border-line text-badge text-muted">
            <th scope="col" className="px-4 py-3 font-semibold">{t.table.product}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.table.price}</th>
            <th scope="col" className="px-3 py-3 font-semibold">{t.table.stock}</th>
            <th scope="col" className="px-3 py-3 text-center font-semibold">{t.table.published}</th>
            <th scope="col" className="px-3 py-3 text-center font-semibold">{t.table.featured}</th>
            <th scope="col" className="px-3 py-3 text-center font-semibold">{t.table.bestseller}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((product) => {
            const on = toggleHandlers(product, onChange);
            return (
              <tr key={product.id}>
                <td className="max-w-xs px-4 py-2">
                  <Identity product={product} />
                </td>
                <td className="px-3 py-2 align-middle">
                  <PriceCell product={product} />
                </td>
                <td className="px-3 py-2 align-middle">
                  <StockCell product={product} />
                </td>
                <td className="px-3 py-2 text-center align-middle">
                  <div className="flex flex-col items-center">
                    <QuickToggle
                      checked={product.status === "active"}
                      onChange={on.published}
                      label={t.toggles.published}
                      name={product.name}
                    />
                    <Badge variant={STATUS_BADGE[product.status]}>{t.status[product.status]}</Badge>
                  </div>
                </td>
                <td className="px-3 py-2 text-center align-middle">
                  <QuickToggle
                    checked={product.is_featured}
                    onChange={on.featured}
                    label={t.toggles.featured}
                    name={product.name}
                  />
                </td>
                <td className="px-3 py-2 text-center align-middle">
                  <QuickToggle
                    checked={product.is_bestseller}
                    onChange={on.bestseller}
                    label={t.toggles.bestseller}
                    name={product.name}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Below md: one card per product with the toggles labelled. */
export function ProductCards({ products, onChange }) {
  return (
    <ul className="flex flex-col divide-y divide-line md:hidden">
      {products.map((product) => {
        const on = toggleHandlers(product, onChange);
        return (
          <li key={product.id} className="flex flex-col gap-2 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <Identity product={product} />
              <Badge variant={STATUS_BADGE[product.status]} className="shrink-0">
                {t.status[product.status]}
              </Badge>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <PriceCell product={product} />
              </div>
              <div className="text-right">
                <StockCell product={product} />
              </div>
            </div>
            <div className="-mb-1 flex flex-wrap gap-x-4">
              <QuickToggle
                showLabel
                checked={product.status === "active"}
                onChange={on.published}
                label={t.toggles.published}
                name={product.name}
              />
              <QuickToggle
                showLabel
                checked={product.is_featured}
                onChange={on.featured}
                label={t.toggles.featured}
                name={product.name}
              />
              <QuickToggle
                showLabel
                checked={product.is_bestseller}
                onChange={on.bestseller}
                label={t.toggles.bestseller}
                name={product.name}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
