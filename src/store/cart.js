import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EVENTS, track } from "../lib/analytics";
import { persistOptions, syncAcrossTabs } from "./persist";

// Same limits as place_order (supabase/README.md), so the cart can never hold
// an order the server will reject for size.
export const MAX_LINES = 20;
export const MAX_QTY_PER_LINE = 10;

const lineKey = (productId, variantId) => `${productId}:${variantId ?? ""}`;

/**
 * Line = { key, productId, variantId, slug, name, variantName, image, price, maxQty, qty }.
 * name/image/price are a display snapshot from when it was added; checkout
 * shows quote_order's numbers, never these.
 */
function snapshot(product, variant) {
  const image = (variant?.image_id && product.images?.find((i) => i.id === variant.image_id)) || product.images?.[0];
  const stock = variant ? variant.stock : product.stock;
  return {
    key: lineKey(product.id, variant?.id),
    productId: product.id,
    variantId: variant?.id ?? null,
    slug: product.slug,
    name: product.name,
    variantName: variant?.name ?? null,
    image: image?.url ?? null,
    price: variant?.price_override ?? product.price,
    maxQty: Math.min(MAX_QTY_PER_LINE, stock),
  };
}

const clampQty = (qty, line) => Math.max(1, Math.min(Math.floor(qty) || 1, line.maxQty));

export const useCart = create(
  persist(
    (set, get) => ({
      lines: [],

      /**
       * Adds (or tops up) a line. Returns { ok, reason?, qty? } so the caller
       * can toast: reason is "out_of_stock" | "max_lines" | "max_qty".
       */
      add(product, { variant = null, qty = 1 } = {}) {
        const next = snapshot(product, variant);
        if (next.maxQty < 1) return { ok: false, reason: "out_of_stock" };

        const lines = get().lines;
        const existing = lines.find((l) => l.key === next.key);
        if (!existing && lines.length >= MAX_LINES) return { ok: false, reason: "max_lines" };
        if (existing && existing.qty >= next.maxQty) return { ok: false, reason: "max_qty" };

        const total = clampQty((existing?.qty ?? 0) + qty, next);
        const line = { ...next, qty: total };
        set({ lines: existing ? lines.map((l) => (l.key === next.key ? line : l)) : [...lines, line] });

        track(EVENTS.addToCart, {
          item_id: product.id,
          item_name: product.name,
          item_variant: next.variantName,
          price: next.price,
          quantity: total - (existing?.qty ?? 0),
        });
        return { ok: true, qty: total };
      },

      setQty(key, qty) {
        set({ lines: get().lines.map((l) => (l.key === key ? { ...l, qty: clampQty(qty, l) } : l)) });
      },

      remove(key) {
        const line = get().lines.find((l) => l.key === key);
        if (!line) return;
        set({ lines: get().lines.filter((l) => l.key !== key) });
        track(EVENTS.removeFromCart, { item_id: line.productId, item_name: line.name, quantity: line.qty });
      },

      clear: () => set({ lines: [] }),
    }),
    persistOptions("cart", { partialize: ({ lines }) => ({ lines }) }),
  ),
);

syncAcrossTabs(useCart);

// Selectors: useCart(selectCartCount) re-renders only when the count changes.
export const selectCartCount = (state) => state.lines.reduce((sum, l) => sum + l.qty, 0);
/** Display-only estimate from snapshots; checkout uses quote_order. */
export const selectCartEstimate = (state) => state.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
