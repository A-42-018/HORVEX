import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRow, insertRow, reorderRows, updateRow } from "../../services/admin";
import { listZoneRows, nextZoneSortOrder } from "../../services/adminDelivery";
import { queryKeys } from "../../services/queryKeys";
import { useAdminCrud, useAdminMutation } from "./useAdminMutation";

// Zones feed the checkout selector and the quote, both under `settings`.
const INVALIDATE = [queryKeys.settings.all];

/** Every zone (off too) with order counts, in checkout order. */
export function useZoneRows() {
  return useQuery({ queryKey: queryKeys.settings.adminZones(), queryFn: listZoneRows, staleTime: 0 });
}

export function useZoneCrud() {
  const crud = useAdminCrud("delivery_zones", { invalidate: INVALIDATE });
  // New zones go last.
  const create = useAdminMutation({
    mutationFn: async (values) => insertRow("delivery_zones", { ...values, sort_order: await nextZoneSortOrder() }),
    invalidate: INVALIDATE,
    activity: (row, values) => ({ action: "create", entity: "delivery_zones", entityId: row.id, diff: values }),
  });
  const remove = useAdminMutation({
    mutationFn: (row) => deleteRow("delivery_zones", row.id),
    invalidate: INVALIDATE,
    activity: (result, row) => ({ action: "delete", entity: "delivery_zones", entityId: row.id, diff: { name: row.name } }),
  });
  return { ...crud, create, remove };
}

/** Quick On/Off switch: optimistic, rolls back on error. */
export function useToggleZone({ onFailed } = {}) {
  const queryClient = useQueryClient();
  const key = queryKeys.settings.adminZones();
  const patch = (id, values) =>
    queryClient.setQueryData(key, (old) => old?.map((row) => (row.id === id ? { ...row, ...values } : row)));

  return useAdminMutation({
    mutationFn: ({ id, patch: values }) => updateRow("delivery_zones", id, values),
    invalidate: INVALIDATE,
    activity: (row, { id, patch: values }) => ({ action: "update", entity: "delivery_zones", entityId: id, diff: values }),
    async onMutate({ id, patch: values }) {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData(key)?.find((row) => row.id === id);
      patch(id, values);
      return { id, previous: Object.fromEntries(Object.keys(values).map((k) => [k, before?.[k]])) };
    },
    onError(error, vars, context) {
      if (context) patch(context.id, context.previous);
      onFailed?.(error);
    },
  });
}

/** Up/down reorder: optimistic, restores the old order on error. mutate(orderedRows). */
export function useReorderZones({ onFailed } = {}) {
  const queryClient = useQueryClient();
  const key = queryKeys.settings.adminZones();
  return useAdminMutation({
    mutationFn: (ordered) => reorderRows("delivery_zones", ordered.map((row) => row.id)),
    invalidate: INVALIDATE,
    activity: (result, ordered) => ({ action: "reorder", entity: "delivery_zones", diff: { ids: ordered.map((r) => r.id) } }),
    async onMutate(ordered) {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData(key);
      queryClient.setQueryData(key, ordered.map((row, index) => ({ ...row, sort_order: index })));
      return { before };
    },
    onError(error, ordered, context) {
      if (context?.before) queryClient.setQueryData(key, context.before);
      onFailed?.(error);
    },
  });
}
