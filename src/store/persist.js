import { createJSONStorage } from "zustand/middleware";

// Shared persist options for client stores: versioned localStorage keys
// ("wristory-<name>"), and other tabs pick up changes via the storage event.
export function persistOptions(name, { version = 1, partialize, migrate } = {}) {
  return {
    name: `wristory-${name}`,
    version,
    storage: createJSONStorage(() => localStorage),
    partialize,
    // A breaking shape change bumps `version`; without a migrate, start empty.
    migrate: migrate ?? (() => undefined),
  };
}

/** Rehydrates a persisted store when another tab writes its key. */
export function syncAcrossTabs(store) {
  if (typeof window === "undefined") return;
  const key = store.persist.getOptions().name;
  window.addEventListener("storage", (event) => {
    if (event.key === key) store.persist.rehydrate();
  });
}
