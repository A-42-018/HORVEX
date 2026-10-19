import { discountPercent, formatTaka } from "../../lib/format";
import { strings } from "../../lib/strings";

// ৳ price with optional compare-at (struck through) and "−x%" when the discount
// is ≥ 10%. Display only: totals the customer pays come from place_order.
const SIZES = {
  sm: { price: "text-body font-semibold tabular-nums", compare: "text-small" },
  md: { price: "text-price", compare: "text-small" },
  lg: { price: "text-price sm:text-h3", compare: "text-body" },
};

function Price({ amount, compareAt, size = "md", showDiscount = true, className = "" }) {
  const percent = discountPercent(amount, compareAt);
  const onSale = compareAt > amount;
  const sizes = SIZES[size];

  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className="sr-only">{onSale ? strings.price.sale : strings.price.current}</span>
      <span className={`${sizes.price} text-brand`}>{formatTaka(amount)}</span>
      {onSale && (
        <>
          <span className="sr-only">{strings.price.regular}</span>
          <s className={`${sizes.compare} tabular-nums text-muted`}>{formatTaka(compareAt)}</s>
        </>
      )}
      {showDiscount && percent > 0 && (
        <span className={`${sizes.compare} font-semibold text-danger`}>
          <span aria-hidden="true">−{percent}%</span>
          <span className="sr-only">{strings.price.off(percent)}</span>
        </span>
      )}
    </p>
  );
}

export default Price;
