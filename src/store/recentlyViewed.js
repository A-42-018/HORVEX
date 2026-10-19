import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistOptions } from "./persist";

// Last products opened on the PDP, newest first (ids only).
const MAX_RECENT = 12;

export const useRecentlyViewed = create(
  persist(
    (set, get) => ({
      ids: [],
      add: (id) => set({ ids: [id, ...get().ids.filter((x) => x !== id)].slice(0, MAX_RECENT) }),
      clear: () => set({ ids: [] }),
    }),
    persistOptions("recently-viewed", { partialize: ({ ids }) => ({ ids }) }),
  ),
);
