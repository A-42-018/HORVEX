import { Minus, Plus } from "lucide-react";
import { strings } from "../../lib/strings";

// Bounded stepper: [1, maxQty]. maxQty already accounts for stock and the
// cart's per-line cap (store/cart.js), so this never lets the qty go higher
// than what `useCart.add` would accept.
function QuantityStepper({ qty, onChange, maxQty, disabled = false }) {
  const dec = () => onChange(Math.max(1, qty - 1));
  const inc = () => onChange(Math.min(maxQty, qty + 1));

  return (
    <div className="inline-flex h-11 items-center rounded-control border border-line">
      <button
        type="button"
        onClick={dec}
        disabled={disabled || qty <= 1}
        aria-label={strings.product.decreaseQty}
        className="flex h-full w-11 items-center justify-center text-fg transition-colors duration-fast disabled:pointer-events-none disabled:opacity-40 hover:bg-fg/10"
      >
        <Minus aria-hidden="true" size={16} strokeWidth={1.5} />
      </button>
      <span className="w-8 text-center text-body tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || qty >= maxQty}
        aria-label={strings.product.increaseQty}
        className="flex h-full w-11 items-center justify-center text-fg transition-colors duration-fast disabled:pointer-events-none disabled:opacity-40 hover:bg-fg/10"
      >
        <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export default QuantityStepper;
