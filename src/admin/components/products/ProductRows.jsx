import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ImageOff } from "lucide-react";
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
      width={44}
      height={56}
      loading="lazy"
      decoding="async"
      className="h-14 w-11 shrink-0 rounded-control bg-raised object-cover ring-1 ring-line"
    />
  ) : (
    <span className="flex h-14 w-11 shrink-0 items-center justify-center rounded-control bg-raised text-muted ring-1 ring-line">
      <ImageOff aria-hidden="true" size={18} strokeWidth={1.5} />
      <span className="sr-only">{t.table.noImage}</span>
    </span>
  );
}

// `wrap` lets a long name take two lines (cards); the table keeps one line.
function Identity({ product, wrap = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Thumb product={product} />
      <div className="min-w-0">
        <Link
          to={`/admin/products/${product.id}`}
          aria-label={t.table.edit(product.name)}
          className={`block rounded-control text-small font-semibold text-fg ${wrap ? "break-words" : "truncate"} transition-colors duration-fast hover:text-brand ${focusRing}`}
        >
          {product.name}
        </Link>
        <p className="break-words text-small text-muted">
          {[product.sku, product.category?.name ?? t.table.uncategorised].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}

function PriceCell({ product }) {
  return (
    <>
      <span className="block whitespace-nowrap text-small font-semibold tabular-nums text-fg">{formatTaka(product.price)}</span>
      {product.compare_at_price > product.price && (
        <s className="block whitespace-nowrap text-small tabular-nums text-muted">{formatTaka(product.compare_at_price)}</s>
      )}
    </>
  );
}

function StockCell({ product }) {
  const state = stockState(product);
  return (
    <>
      <span className={`block whitespace-nowrap text-small font-semibold tabular-nums ${STOCK_TEXT[state]}`}>
        {state === "out" ? t.stock.out : t.table.units(product.stock)}
      </span>
      {state === "low" && <span className="block text-small text-warning">{t.stock.low}</span>}
      {product.variantCount > 0 && <span className="block text-small text-muted">{t.table.variants(product.variantCount)}</span>}
    </>
  );
}

/** 44px checkbox target. `indeterminate` is a DOM property, so it's set on the node. */
export function SelectBox({ checked, indeterminate = false, onChange, label, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-control hover:bg-fg/5 ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
        className="h-4 w-4 cursor-pointer accent-gold"
      />
    </label>
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

const th = "py-3 text-badge font-semibold text-muted";

/** xl+: a real table with one row per product. `selection` = { has, toggle, all, some, toggleAll }. */
export function ProductTable({ products, onChange, selection }) {
  return (
    <div className="hidden overflow-x-auto xl:block">
      <table className="w-full min-w-[42rem] table-fixed border-collapse text-left">
        <caption className="sr-only">{t.table.caption}</caption>
        <colgroup>
          <col className="w-14" />
          <col />
          <col className="w-28" />
          <col className="w-32" />
          <col className="w-24" />
          <col className="w-20" />
          <col className="w-20" />
        </colgroup>
        <thead className="border-b border-line">
          <tr>
            <th scope="col" className="py-1 pl-2">
              <SelectBox
                checked={selection.all}
                indeterminate={selection.some && !selection.all}
                onChange={selection.toggleAll}
                label={t.select.all}
              />
            </th>
            <th scope="col" className={`${th} pl-1 pr-3`}>{t.table.product}</th>
            <th scope="col" className={`${th} px-3`}>{t.table.price}</th>
            <th scope="col" className={`${th} px-3`}>{t.table.stock}</th>
            <th scope="col" className={`${th} px-1 text-center`}>{t.table.published}</th>
            <th scope="col" className={`${th} px-1 text-center`}>{t.table.featured}</th>
            <th scope="col" className={`${th} px-1 text-center`}>{t.table.bestseller}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((product) => {
            const on = toggleHandlers(product, onChange);
            const selected = selection.has(product.id);
            return (
              <tr
                key={product.id}
                className={`transition-colors duration-fast ${selected ? "bg-brand/[0.06]" : "hover:bg-fg/[0.03]"}`}
              >
                <td className="py-2 pl-2 align-middle">
                  <SelectBox
                    checked={selected}
                    onChange={() => selection.toggle(product.id)}
                    label={t.select.one(product.name)}
                  />
                </td>
                <td className="py-2.5 pl-1 pr-3 align-middle">
                  <Identity product={product} />
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <PriceCell product={product} />
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <StockCell product={product} />
                </td>
                <td className="px-1 py-2 text-center align-middle">
                  <div className="flex flex-col items-center gap-0.5">
                    <QuickToggle
                      checked={product.status === "active"}
                      onChange={on.published}
                      label={t.toggles.published}
                      name={product.name}
                    />
                    <Badge variant={STATUS_BADGE[product.status]}>{t.status[product.status]}</Badge>
                  </div>
                </td>
                <td className="px-1 py-2 text-center align-middle">
                  <QuickToggle
                    checked={product.is_featured}
                    onChange={on.featured}
                    label={t.toggles.featured}
                    name={product.name}
                  />
                </td>
                <td className="px-1 py-2 text-center align-middle">
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

/** Below xl: one card per product with the toggles labelled; two columns from md. */
export function ProductCards({ products, onChange, selection }) {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 xl:hidden">
      {products.map((product) => {
        const on = toggleHandlers(product, onChange);
        const selected = selection.has(product.id);
        return (
          <li
            key={product.id}
            className={`flex flex-col gap-3 border-b border-line py-4 pl-1 pr-4 transition-colors duration-fast last:border-b-0 md:odd:border-r ${selected ? "bg-brand/[0.06]" : ""}`}
          >
            <div className="flex items-start gap-1">
              <SelectBox
                checked={selected}
                onChange={() => selection.toggle(product.id)}
                label={t.select.one(product.name)}
                className="mt-1.5"
              />
              <div className="min-w-0 flex-1">
                <Identity product={product} wrap />
              </div>
              <Badge variant={STATUS_BADGE[product.status]} className="mt-1 shrink-0">
                {t.status[product.status]}
              </Badge>
            </div>
            <div className="flex items-start justify-between gap-3 pl-12">
              <div>
                <PriceCell product={product} />
              </div>
              <div className="text-right">
                <StockCell product={product} />
              </div>
            </div>
            <div className="-mb-1 flex flex-wrap gap-x-4 pl-11">
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
