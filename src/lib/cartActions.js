import { toast } from "sonner";
import { useCart } from "../store/cart";
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
