import { create } from "zustand";

// Storefront overlays (cart drawer, mobile menu, search). Only one is open at a
// time, so opening one closes the rest. Not persisted: a refresh starts closed.
const CLOSED = { cartOpen: false, menuOpen: false, searchOpen: false };

export const useUI = create((set) => ({
  ...CLOSED,
  openCart: () => set({ ...CLOSED, cartOpen: true }),
  openMenu: () => set({ ...CLOSED, menuOpen: true }),
  openSearch: () => set({ ...CLOSED, searchOpen: true }),
  closeAll: () => set(CLOSED),
}));
