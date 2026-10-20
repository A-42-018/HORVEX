import { useQuery, useQueryClient } from "@tanstack/react-query";
import { reorderRows, updateRow } from "../../services/admin";
import { listHomeSectionRows } from "../../services/adminHomeSections";
import { queryKeys } from "../../services/queryKeys";
import { useAdminMutation } from "./useAdminMutation";

// The storefront reads the whole content domain (5-minute cache), and the admin
// list lives under it too, so one invalidation refreshes both.
const INVALIDATE = [queryKeys.content.all];
const KEY = queryKeys.content.adminHomeSections();

/** Every home section (hidden too), in storefront order. */
export function useHomeSectionRows() {
  return useQuery({ queryKey: KEY, queryFn: listHomeSectionRows, staleTime: 0 });
}

/** Edit a section's text: mutate({ id, patch }). */
export function useUpdateHomeSection() {
  return useAdminMutation({
    mutationFn: ({ id, patch }) => updateRow("home_sections", id, patch),
    invalidate: INVALIDATE,
    activity: (row, { id, patch }) => ({ action: "update", entity: "home_sections", entityId: id, diff: patch }),
  });
}

/** Visibility switch: the row updates at once and rolls back on error. */
export function useToggleHomeSection() {
  const queryClient = useQueryClient();
  const patch = (id, values) =>
    queryClient.setQueryData(KEY, (old) => old?.map((row) => (row.id === id ? { ...row, ...values } : row)));

  return useAdminMutation({
    mutationFn: ({ id, patch: values }) => updateRow("home_sections", id, values),
    invalidate: INVALIDATE,
    activity: (row, { id, patch: values }) => ({ action: "update", entity: "home_sections", entityId: id, diff: values }),
    async onMutate({ id, patch: values }) {
      await queryClient.cancelQueries({ queryKey: KEY });
      const before = queryClient.getQueryData(KEY)?.find((row) => row.id === id);
      patch(id, values);
      return { id, previous: Object.fromEntries(Object.keys(values).map((k) => [k, before?.[k]])) };
    },
    onError(error, vars, context) {
      if (context) patch(context.id, context.previous);
    },
  });
}

/** Reorder: optimistic, restores the old order on error. mutate(orderedRows). */
export function useReorderHomeSections() {
  const queryClient = useQueryClient();
  return useAdminMutation({
    mutationFn: (ordered) => reorderRows("home_sections", ordered.map((row) => row.id)),
    invalidate: INVALIDATE,
    activity: (result, ordered) => ({ action: "reorder", entity: "home_sections", diff: { keys: ordered.map((r) => r.key) } }),
    async onMutate(ordered) {
      await queryClient.cancelQueries({ queryKey: KEY });
      const before = queryClient.getQueryData(KEY);
      queryClient.setQueryData(KEY, ordered.map((row, index) => ({ ...row, sort_order: index })));
      return { before };
    },
    onError(error, ordered, context) {
      if (context?.before) queryClient.setQueryData(KEY, context.before);
    },
  });
}
