import { useQuery } from "@tanstack/react-query";
import { getFreeDeliveryThreshold, getSettingsRow, saveFreeDeliveryThreshold, saveSettingsPatch } from "../../services/adminSettings";
import { queryKeys } from "../../services/queryKeys";
import { useAdminMutation } from "./useAdminMutation";

// The storefront reads site_settings under `settings` (footer, FAB, bar, maintenance),
// so every write invalidates that domain; `content` too (announcements live there).
const INVALIDATE = [queryKeys.settings.all, queryKeys.content.all];

export const useSettingsRow = () =>
  useQuery({ queryKey: queryKeys.settings.adminRow(), queryFn: getSettingsRow, staleTime: 0, refetchOnWindowFocus: false });

/** mutate(patch): owner only. Logs the changed column names (not values: pixel IDs, phones). */
export const useSaveSettings = () =>
  useAdminMutation({
    mutationFn: (patch) => saveSettingsPatch(patch),
    invalidate: INVALIDATE,
    activity: (result, patch) => ({
      action: "update",
      entity: "site_settings",
      entityId: "settings",
      diff: Object.fromEntries(
        Object.entries(patch).map(([column, value]) => [column, column === "maintenance_mode" ? value : "changed"]),
      ),
    }),
  });

export const useFreeDeliveryThreshold = () =>
  useQuery({ queryKey: queryKeys.settings.adminThreshold(), queryFn: getFreeDeliveryThreshold, staleTime: 0 });

/** mutate(amount | null): manager+, via `set_free_delivery_threshold`. */
export const useSaveFreeDeliveryThreshold = () =>
  useAdminMutation({
    mutationFn: (amount) => saveFreeDeliveryThreshold(amount),
    invalidate: [...INVALIDATE, queryKeys.settings.adminThreshold()],
    activity: (result, amount) => ({
      action: "update",
      entity: "site_settings",
      entityId: "free_delivery_threshold",
      diff: { free_delivery_threshold: amount },
    }),
  });
