import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistOptions, syncAcrossTabs } from "./persist";

// Admin new-order alerts. Only `soundOn` is persisted (key wristory-admin-alerts);
// the badge count and the on-screen cards live for this session only, because
// the dashboard's "Pending confirmations" is the durable source of truth.
// Imported only from admin code, so it stays in the admin chunk.
export const MAX_ALERTS = 3;

/** Alert = { id, orderNumber, customerName, total, district, createdAt } */
export const useOrderAlerts = create(
  persist(
    (set) => ({
      soundOn: true,
      toggleSound: () => set((state) => ({ soundOn: !state.soundOn })),

      unseen: 0,
      alerts: [],
      // `countUnseen: false` while the owner is already looking at the orders list.
      push: (alert, { countUnseen = true } = {}) =>
        set((state) => ({
          unseen: countUnseen ? state.unseen + 1 : state.unseen,
          alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS),
        })),
      dismiss: (id) => set((state) => ({ alerts: state.alerts.filter((alert) => alert.id !== id) })),
      clearUnseen: () => set({ unseen: 0 }),
      reset: () => set({ unseen: 0, alerts: [] }),
    }),
    persistOptions("admin-alerts", { partialize: (state) => ({ soundOn: state.soundOn }) }),
  ),
);

syncAcrossTabs(useOrderAlerts);

export const selectUnseen = (state) => state.unseen;
