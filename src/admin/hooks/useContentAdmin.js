import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAnnouncementRows, listFaqRows, listPageRows, listTestimonialRows, nextFaqSortOrder, nextTestimonialSortOrder, saveAnnouncementRows } from "../../services/adminContent";
import { queryKeys } from "../../services/queryKeys";
import { useAdminCrud, useAdminMutation } from "./useAdminMutation";
import { makeContentHooks } from "./useHomeContentAdmin";

export const faqHooks = makeContentHooks({
  table: "faqs",
  key: queryKeys.content.adminFaqs(),
  list: listFaqRows,
  nextSort: nextFaqSortOrder,
  imageColumns: [],
});

export const testimonialHooks = makeContentHooks({
  table: "testimonials",
  key: queryKeys.content.adminTestimonials(),
  list: listTestimonialRows,
  nextSort: nextTestimonialSortOrder,
  imageColumns: ["photo_url"],
});

const key = queryKeys.content.adminAnnouncements();

export const useAnnouncementRows = () => useQuery({ queryKey: key, queryFn: getAnnouncementRows, staleTime: 0 });

/**
 * Saves the full message list (add / edit / delete / move all go through here).
 * The bar reads site_settings, so both the content and settings domains refresh.
 * mutate({ messages, change }): `change` is a short label for the activity log.
 */
export function useSaveAnnouncements() {
  const queryClient = useQueryClient();
  return useAdminMutation({
    mutationFn: ({ messages }) => saveAnnouncementRows(messages),
    invalidate: [queryKeys.content.all, queryKeys.settings.all],
    activity: (result, { messages, change }) => ({
      action: "update",
      entity: "site_settings",
      entityId: "announcements",
      diff: { change, count: messages.length },
    }),
    async onMutate({ messages }) {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData(key);
      queryClient.setQueryData(key, messages);
      return { before };
    },
    onError(error, vars, context) {
      if (context?.before) queryClient.setQueryData(key, context.before);
    },
  });
}

/** Pages are edited in place (no create / delete / reorder), so only the list and update are exposed. */
export const usePageRows = () => useQuery({ queryKey: queryKeys.content.adminPages(), queryFn: listPageRows, staleTime: 0 });
export const usePageUpdate = () => useAdminCrud("pages", { invalidate: [queryKeys.content.all] }).update;
