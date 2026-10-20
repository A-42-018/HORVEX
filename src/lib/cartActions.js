import { toast } from "sonner";
import { lineKey, useCart } from "../store/cart";
import { useUI } from "../store/ui";
import { strings } from "./strings";
import { flyToBag } from "./flyToBag";

const FAILURE_COPY = {
  out_of_stock: strings.badge.soldOut,
  max_qty: strings.product.maxQty,
  max_lines: strings.product.bagFull,
};

/**
 * The one way to add to the bag from anywhere in the storefront.
 * Success opens the cart drawer (the drawer is the feedback); failure toasts
 * the reason and leaves the drawer alone. Returns the store's { ok, reason?, qty? }.
 * With `from` (the card image or the clicked button) a thumbnail first flies to
 * the bag icon, then the drawer opens (at once under reduced motion).
 */
export function addToBag(product, options, { from } = {}) {
  const result = useCart.getState().add(product, options);
  if (!result.ok) {
    toast.error(FAILURE_COPY[result.reason] ?? strings.product.addFailed);
    return result;
  }
  const openCart = () => useUI.getState().openCart();
  if (!from) openCart();
  else {
    const key = lineKey(product.id, options?.variant?.id);
    const image = useCart.getState().lines.find((l) => l.key === key)?.image;
    flyToBag(from, image).then(openCart);
  }
  return result;
}

/**
 * "Order now": puts exactly `qty` of this item in the bag (replacing any earlier
 * qty of the same line, so it never doubles up) without opening the drawer.
 * The line's snapshot (price, image, stock cap) is refreshed from `product`;
 * if stock caps the qty, it toasts. The caller navigates to /checkout on
 * { ok: true }. Other bag lines stay.
 */
export function buyNow(product, { variant = null, qty = 1 } = {}) {
  const result = useCart.getState().replace(product, { variant, qty });
  if (!result.ok) toast.error(FAILURE_COPY[result.reason] ?? strings.product.addFailed);
  else if (result.clamped) toast(strings.product.qtyClamped(result.qty));
  return result;
}
