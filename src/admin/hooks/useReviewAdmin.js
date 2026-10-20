import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { deleteRow, insertRow, updateRow } from "../../services/admin";
import { getReviewCounts, listAdminReviews, listReviewProducts, removeReviewPhoto } from "../../services/adminReviews";
import { queryKeys } from "../../services/queryKeys";
import { useAdminMutation } from "./useAdminMutation";

// The store reads reviews through the products domain (PDP) and the content
// domain (home carousel + summary), so every write refreshes all three.
const invalidate = [queryKeys.reviews.all, queryKeys.products.all, queryKeys.content.all];

export function useAdminReviews(filters, limit) {
  const key = { ...filters, limit };
  return useQuery({
    queryKey: queryKeys.reviews.adminList(key),
    queryFn: () => listAdminReviews(key),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export const useReviewCounts = () => useQuery({ queryKey: queryKeys.reviews.adminCounts(), queryFn: getReviewCounts, staleTime: 15_000 });

export const useReviewProducts = (enabled) =>
  useQuery({ queryKey: queryKeys.reviews.adminProducts(), queryFn: listReviewProducts, enabled, staleTime: 60_000 });

/** mutate({ id, status }) with status approved | rejected | pending. */
export const useSetReviewStatus = () =>
  useAdminMutation({
    mutationFn: ({ id, status }) => updateRow("reviews", id, { status }),
    invalidate,
    activity: (row, { id, status }) => ({ action: "update", entity: "reviews", entityId: id, diff: { status } }),
  });

export const useCreateReview = () =>
  useAdminMutation({
    mutationFn: (values) => insertRow("reviews", values),
    invalidate,
    activity: (row, values) => ({ action: "create", entity: "reviews", entityId: row.id, diff: { name: values.name, rating: values.rating, status: values.status } }),
  });

/** mutate(row): deletes the row, then its uploaded photo. */
export const useRemoveReview = () =>
  useAdminMutation({
    mutationFn: async (row) => {
      await deleteRow("reviews", row.id);
      await removeReviewPhoto(row.photo_url);
    },
    invalidate,
    activity: (result, row) => ({ action: "delete", entity: "reviews", entityId: row.id, diff: { name: row.name } }),
  });
