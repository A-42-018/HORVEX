import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRow, insertRow, logActivity, reorderRows, updateRow } from "../../services/admin";

function logQuietly(entry) {
  // A failed log entry must not turn a saved change into an error.
  logActivity(entry).catch((error) => {
    if (import.meta.env.DEV) console.warn("activity_log write failed", error);
  });
}

/**
 * useMutation for admin writes: on success it records an activity_log entry
 * and invalidates whole domains, e.g.
 *   useAdminMutation({
 *     mutationFn: (vars) => …,
 *     invalidate: [queryKeys.orders.all],
 *     activity: (result, vars) => ({ action: "status", entity: "orders", entityId: vars.id, diff: { to: vars.status } }),
 *   })
 */
export function useAdminMutation({ mutationFn, invalidate = [], activity, onSuccess, ...options }) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn,
    async onSuccess(...args) {
      const [result, variables] = args;
      if (activity) logQuietly(activity(result, variables));
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      return onSuccess?.(...args);
    },
  });
}

/**
 * Create / update / remove / reorder for one table, logged under `entity`.
 *   const { create, update, remove, reorder } = useAdminCrud("categories", { invalidate: [queryKeys.categories.all] });
 *   update.mutate({ id, patch: { name } });
 */
export function useAdminCrud(table, { invalidate = [], entity = table, idColumn = "id" } = {}) {
  const shared = { invalidate };
  const idOf = (row) => row?.[idColumn];

  return {
    create: useAdminMutation({
      ...shared,
      mutationFn: (values) => insertRow(table, values),
      activity: (row, values) => ({ action: "create", entity, entityId: idOf(row), diff: values }),
    }),
    update: useAdminMutation({
      ...shared,
      mutationFn: ({ id, patch }) => updateRow(table, id, patch, { idColumn }),
      activity: (row, { id, patch }) => ({ action: "update", entity, entityId: id, diff: patch }),
    }),
    remove: useAdminMutation({
      ...shared,
      mutationFn: (id) => deleteRow(table, id, { idColumn }),
      activity: (result, id) => ({ action: "delete", entity, entityId: id }),
    }),
    reorder: useAdminMutation({
      ...shared,
      mutationFn: (ids) => reorderRows(table, ids, { idColumn }),
      activity: (result, ids) => ({ action: "reorder", entity, diff: { ids } }),
    }),
  };
}
