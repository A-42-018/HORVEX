import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRow, insertRow, reorderRows, updateRow } from "../../services/admin";
import {
  listCollectionPicks,
  listCollectionRows,
  listRuleCategories,
  nextCollectionSortOrder,
  removeCollectionBannerFile,
  saveCollectionPicks,
} from "../../services/adminCollections";
import { queryKeys } from "../../services/queryKeys";
import { useAdminMutation } from "./useAdminMutation";

// Collections show in the storefront menu and /collection/<slug>; a hand-picked
// list embeds products, so only the collections domain needs refreshing.
const INVALIDATE = [queryKeys.collections.all];

/** Every collection (hidden and out-of-window too) with pick counts, in storefront order. */
export function useCollectionRows() {
  return useQuery({ queryKey: queryKeys.collections.adminRows(), queryFn: listCollectionRows, staleTime: 0 });
}

/** The hand-picked products of one collection (only fetched when `enabled`). */
export function useCollectionPicks(id, enabled = true) {
  return useQuery({
    queryKey: queryKeys.collections.adminPicks(id),
    queryFn: () => listCollectionPicks(id),
    enabled: Boolean(id) && enabled,
    staleTime: 0,
  });
}

export function useRuleCategories() {
  return useQuery({ queryKey: queryKeys.collections.adminCategories(), queryFn: listRuleCategories, staleTime: 60_000 });
}

/**
 * Create or update a collection and, when `productIds` is given, replace its
 * hand-picked list. A failed list write after a saved row reports `picksFailed`.
 * mutate({ collection: row | null, payload, patch, productIds: string[] | null })
 */
export function useSaveCollection() {
  return useAdminMutation({
    mutationFn: async ({ collection, payload, patch, productIds }) => {
      let row = collection;
      if (!collection) row = await insertRow("collections", { ...payload, sort_order: await nextCollectionSortOrder() });
      else if (Object.keys(patch).length) row = await updateRow("collections", collection.id, patch);
      if (productIds) {
        try {
          await saveCollectionPicks(row.id, productIds);
        } catch (error) {
          error.picksFailed = true;
          throw error;
        }
      }
      return row;
    },
    invalidate: INVALIDATE,
    activity: (row, { collection, payload, patch, productIds }) => ({
      action: collection ? "update" : "create",
      entity: "collections",
      entityId: row.id,
      diff: { ...(collection ? patch : payload), ...(productIds ? { products: productIds.length } : {}) },
    }),
  });
}

export function useRemoveCollection() {
  return useAdminMutation({
    mutationFn: async (row) => {
      await deleteRow("collections", row.id);
      await removeCollectionBannerFile(row.banner);
    },
    invalidate: INVALIDATE,
    activity: (result, row) => ({ action: "delete", entity: "collections", entityId: row.id, diff: { slug: row.slug } }),
  });
}

/** Quick visibility switch: the row updates at once and rolls back on error. */
export function useToggleCollection({ onFailed } = {}) {
  const queryClient = useQueryClient();
  const key = queryKeys.collections.adminRows();
  const patch = (id, values) =>
    queryClient.setQueryData(key, (old) => old?.map((row) => (row.id === id ? { ...row, ...values } : row)));

  return useAdminMutation({
    mutationFn: ({ id, patch: values }) => updateRow("collections", id, values),
    invalidate: INVALIDATE,
    activity: (row, { id, patch: values }) => ({ action: "update", entity: "collections", entityId: id, diff: values }),
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
export function useReorderCollections() {
  const queryClient = useQueryClient();
  const key = queryKeys.collections.adminRows();
  return useAdminMutation({
    mutationFn: (ordered) => reorderRows("collections", ordered.map((row) => row.id)),
    invalidate: INVALIDATE,
    activity: (result, ordered) => ({ action: "reorder", entity: "collections", diff: { ids: ordered.map((r) => r.id) } }),
    async onMutate(ordered) {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData(key);
      queryClient.setQueryData(key, ordered.map((row, index) => ({ ...row, sort_order: index })));
      return { before };
    },
    onError(error, ordered, context) {
      if (context?.before) queryClient.setQueryData(key, context.before);
    },
  });
}
