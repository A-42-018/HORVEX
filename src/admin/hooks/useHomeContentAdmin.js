import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRow, insertRow, reorderRows, updateRow } from "../../services/admin";
import {
  PROMO_PLACEMENT,
  listHeroRows,
  listPromoRows,
  nextHeroSortOrder,
  nextPromoSortOrder,
  removeContentImageFiles,
} from "../../services/adminHomeContent";
import { queryKeys } from "../../services/queryKeys";
import { useAdminCrud, useAdminMutation } from "./useAdminMutation";

// Hero slides and promo banners show on the home page through the content
// domain (5-minute cache); the admin lists live under it too, so one
// invalidation refreshes both.
const INVALIDATE = [queryKeys.content.all];

/** Builds the list / crud / toggle / reorder hooks for one sortable content table. */
export function makeContentHooks({ table, key, list, nextSort, createExtra = {}, imageColumns }) {
  const useRows = () => useQuery({ queryKey: key, queryFn: list, staleTime: 0 });

  const useCrud = () => {
    const crud = useAdminCrud(table, { invalidate: INVALIDATE });
    // New rows go last.
    const create = useAdminMutation({
      mutationFn: async (values) => insertRow(table, { ...values, ...createExtra, sort_order: await nextSort() }),
      invalidate: INVALIDATE,
      activity: (row, values) => ({ action: "create", entity: table, entityId: row.id, diff: values }),
    });
    const remove = useAdminMutation({
      mutationFn: async (row) => {
        await deleteRow(table, row.id);
        await removeContentImageFiles((imageColumns ?? []).map((column) => row[column]).filter(Boolean));
      },
      invalidate: INVALIDATE,
      activity: (result, row) => ({ action: "delete", entity: table, entityId: row.id, diff: { title: row.title ?? row.question ?? row.name } }),
    });
    return { ...crud, create, remove };
  };

  /** On/off switch: the row updates at once and rolls back on error. */
  const useToggle = ({ onFailed } = {}) => {
    const queryClient = useQueryClient();
    const patch = (id, values) =>
      queryClient.setQueryData(key, (old) => old?.map((row) => (row.id === id ? { ...row, ...values } : row)));
    return useAdminMutation({
      mutationFn: ({ id, patch: values }) => updateRow(table, id, values),
      invalidate: INVALIDATE,
      activity: (row, { id, patch: values }) => ({ action: "update", entity: table, entityId: id, diff: values }),
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
  };

  /** Up/down/drag reorder: optimistic, restores the old order on error. mutate(orderedRows). */
  const useReorder = ({ onFailed } = {}) => {
    const queryClient = useQueryClient();
    return useAdminMutation({
      mutationFn: (ordered) => reorderRows(table, ordered.map((row) => row.id)),
      invalidate: INVALIDATE,
      activity: (result, ordered) => ({ action: "reorder", entity: table, diff: { ids: ordered.map((r) => r.id) } }),
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
  };

  return { useRows, useCrud, useToggle, useReorder };
}

export const heroHooks = makeContentHooks({
  table: "hero_slides",
  key: queryKeys.content.adminHeroSlides(),
  list: listHeroRows,
  nextSort: nextHeroSortOrder,
  imageColumns: ["image_desktop", "image_mobile"],
});

export const promoHooks = makeContentHooks({
  table: "banners",
  key: queryKeys.content.adminPromoBanners(),
  list: listPromoRows,
  nextSort: nextPromoSortOrder,
  createExtra: { placement: PROMO_PLACEMENT },
  imageColumns: ["image", "image_mobile"],
});
