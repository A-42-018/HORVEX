import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EVENTS, track } from "../lib/analytics";
import { persistOptions, syncAcrossTabs } from "./persist";

// Product ids only, newest first. The wishlist page loads fresh product data
// with useProductsByIds, so prices and stock are never stale.
export const MAX_WISHLIST = 60;

export const useWishlist = create(
  persist(
    (set, get) => ({
      ids: [],

      has: (id) => get().ids.includes(id),

      /** Adds or removes; returns true when the product is now in the wishlist. */
      toggle(product) {
        const ids = get().ids;
        if (ids.includes(product.id)) {
          set({ ids: ids.filter((id) => id !== product.id) });
          return false;
        }
        set({ ids: [product.id, ...ids].slice(0, MAX_WISHLIST) });
        track(EVENTS.addToWishlist, { item_id: product.id, item_name: product.name, price: product.price });
        return true;
      },

      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      clear: () => set({ ids: [] }),
    }),
    persistOptions("wishlist", { partialize: ({ ids }) => ({ ids }) }),
  ),
);

syncAcrossTabs(useWishlist);

export const selectWishlistCount = (state) => state.ids.length;
/** useWishlist(selectInWishlist(id)) → boolean, re-renders only for that product. */
export const selectInWishlist = (id) => (state) => state.ids.includes(id);
