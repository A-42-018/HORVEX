import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistOptions, syncAcrossTabs } from "./persist";

// Last submitted search terms, newest first (case-insensitive de-dupe).
const MAX_RECENT = 6;

export const useRecentSearches = create(
  persist(
    (set, get) => ({
      terms: [],
      add: (term) => {
        const clean = term.trim();
        if (!clean) return;
        const key = clean.toLowerCase();
        set({
          terms: [clean, ...get().terms.filter((t) => t.toLowerCase() !== key)].slice(0, MAX_RECENT),
        });
      },
      remove: (term) => set({ terms: get().terms.filter((t) => t !== term) }),
      clear: () => set({ terms: [] }),
    }),
    persistOptions("recent-searches", { partialize: ({ terms }) => ({ terms }) }),
  ),
);

syncAcrossTabs(useRecentSearches);
