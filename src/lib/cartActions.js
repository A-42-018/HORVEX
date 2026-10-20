import { toast } from "sonner";
import { lineKey, useCart } from "../store/cart";
import { useUI } from "../store/ui";
import { strings } from "./strings";

const FAILURE_COPY = {
  out_of_stock: strings.badge.soldOut,
  max_qty: strings.product.maxQty,
  max_lines: strings.product.bagFull,
};

/**
 * The one way to add to the bag from anywhere in the storefront.
 * Success opens the cart drawer (the drawer is the feedback); failure toasts
 * the reason and leaves the drawer alone. Returns the store's { ok, reason?, qty? }.
 */
export function addToBag(product, options) {
  const result = useCart.getState().add(product, options);
  if (result.ok) useUI.getState().openCart();
  else toast.error(FAILURE_COPY[result.reason] ?? strings.product.addFailed);
  return result;
}

/**
 * "Order now": puts exactly `qty` of this item in the bag (replacing any earlier
 * qty of the same line, so it never doubles up) without opening the drawer.
 * The caller navigates to /checkout on { ok: true }. Other bag lines stay.
 */
export function buyNow(product, { variant = null, qty = 1 } = {}) {
  const { lines, add, setQty } = useCart.getState();
  const key = lineKey(product.id, variant?.id);
  if (lines.some((l) => l.key === key)) {
    setQty(key, qty);
    return { ok: true };
  }
  const result = add(product, { variant, qty });
  if (!result.ok) toast.error(FAILURE_COPY[result.reason] ?? strings.product.addFailed);
  return result;
}
