import { Minus, Plus } from "lucide-react";
import { IconButton } from "../common";
import { useSiteSettings } from "../../hooks/useContent";
import { useCart } from "../../store/cart";
import { formatTaka } from "../../lib/format";
import { strings } from "../../lib/strings";

const t = strings.cart;

// Shared by the cart drawer and the /cart page so both behave identically.

export function QtyStepper({ line }) {
  const setQty = useCart((s) => s.setQty);
  const atMax = line.qty >= line.maxQty;
  return (
    <div className="inline-flex items-center rounded-control border border-line" role="group" aria-label={t.qtyGroup(line.name)}>
      <IconButton
        label={t.decrease(line.name)}
        variant="ghost"
        disabled={line.qty <= 1}
        onClick={() => setQty(line.key, line.qty - 1)}
      >
        <Minus size={16} strokeWidth={1.5} aria-hidden="true" />
      </IconButton>
      <span className="min-w-8 text-center text-small tabular-nums" aria-live="polite">
        {line.qty}
      </span>
      <IconButton
        label={atMax ? t.maxQty : t.increase(line.name)}
        variant="ghost"
        disabled={atMax}
        onClick={() => setQty(line.key, line.qty + 1)}
      >
        <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
      </IconButton>
    </div>
  );
}

// Progress towards free delivery. Hidden when the store has no threshold set.
// `amount` is what counts towards the threshold (the engine uses subtotal − discount).
export function FreeDeliveryBar({ amount, className = "mb-2" }) {
  const { data: settings } = useSiteSettings();
  const threshold = settings?.free_delivery_threshold;
  if (!threshold) return null;

  const remaining = Math.max(0, threshold - amount);
  const percent = Math.min(100, Math.round((amount / threshold) * 100));
  return (
    <div className={`rounded-card border border-line bg-surface p-4 ${className}`}>
      <p className="text-small text-fg" role="status">
        {remaining > 0 ? t.freeDeliveryMore(formatTaka(remaining)) : t.freeDeliveryReached}
      </p>
      <div
        role="progressbar"
        aria-label={t.freeDeliveryLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-3 h-1 overflow-hidden rounded-pill bg-line"
      >
        <div
          className="h-full origin-left rounded-pill bg-gold transition-transform duration-slow"
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>
    </div>
  );
}
