import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRow, insertRow, reorderRows, updateRow } from "../../services/admin";
import { listCategoryRows, nextCategorySortOrder, removeCategoryImageFile } from "../../services/adminCategories";
import { queryKeys } from "../../services/queryKeys";
import { useAdminCrud, useAdminMutation } from "./useAdminMutation";

// A category shows in the storefront nav, tiles, filters and product cards;
// products embed their category, so the products domain refreshes too.
const INVALIDATE = [queryKeys.categories.all, queryKeys.products.all];

/** Every category (hidden too) with product counts, in storefront order. */
export function useCategoryRows() {
  return useQuery({ queryKey: queryKeys.categories.adminRows(), queryFn: listCategoryRows, staleTime: 0 });
}

export function useCategoryCrud() {
  const crud = useAdminCrud("categories", { invalidate: INVALIDATE });
  // New categories go last.
  const create = useAdminMutation({
    mutationFn: async (values) => insertRow("categories", { ...values, sort_order: await nextCategorySortOrder() }),
    invalidate: INVALIDATE,
    activity: (row, values) => ({ action: "create", entity: "categories", entityId: row.id, diff: values }),
  });
  const remove = useAdminMutation({
    mutationFn: async (row) => {
      await deleteRow("categories", row.id);
      await removeCategoryImageFile(row.image);
    },
    invalidate: INVALIDATE,
    activity: (result, row) => ({ action: "delete", entity: "categories", entityId: row.id, diff: { slug: row.slug } }),
  });
  return { ...crud, create, remove };
}

/** Quick visibility switch: the row updates at once and rolls back on error. */
export function useToggleCategory({ onFailed } = {}) {
  const queryClient = useQueryClient();
  const key = queryKeys.categories.adminRows();
  const patch = (id, values) =>
    queryClient.setQueryData(key, (old) => old?.map((row) => (row.id === id ? { ...row, ...values } : row)));

  return useAdminMutation({
    mutationFn: ({ id, patch: values }) => updateRow("categories", id, values),
    invalidate: INVALIDATE,
    activity: (row, { id, patch: values }) => ({ action: "update", entity: "categories", entityId: id, diff: values }),
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
export function useReorderCategories({ onFailed } = {}) {
  const queryClient = useQueryClient();
  const key = queryKeys.categories.adminRows();
  return useAdminMutation({
    mutationFn: (ordered) => reorderRows("categories", ordered.map((row) => row.id)),
    invalidate: INVALIDATE,
    activity: (result, ordered) => ({ action: "reorder", entity: "categories", diff: { ids: ordered.map((r) => r.id) } }),
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
