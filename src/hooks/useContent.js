import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../services/queryKeys";
import {
  getPage,
  getReviewSummary,
  listBanners,
  listFaqs,
  listHeroSlides,
  listHomeSections,
  listRecentReviews,
  listTestimonials,
  sendContactMessage,
  subscribe,
} from "../services/content";
import { getSiteSettings, listDeliveryZones } from "../services/settings";

// Content and settings are edited from the admin and change rarely; admin
// saves invalidate their domain, so a long staleTime is safe.
const CONTENT_STALE = 5 * 60_000;

const contentQuery = (queryKey, queryFn, extra) => ({ queryKey, queryFn, staleTime: CONTENT_STALE, ...extra });

export const useHomeSections = () => useQuery(contentQuery(queryKeys.content.homeSections(), listHomeSections));
export const useHeroSlides = () => useQuery(contentQuery(queryKeys.content.heroSlides(), listHeroSlides));
export const useBanners = (placement) =>
  useQuery(contentQuery(queryKeys.content.banners(placement), () => listBanners(placement)));
export const useFaqs = () => useQuery(contentQuery(queryKeys.content.faqs(), listFaqs));
export const useTestimonials = () => useQuery(contentQuery(queryKeys.content.testimonials(), listTestimonials));
export const useRecentReviews = (limit = 8) =>
  useQuery(contentQuery(queryKeys.content.recentReviews(limit), () => listRecentReviews(limit)));
export const useReviewSummary = () => useQuery(contentQuery(queryKeys.content.reviewSummary(), getReviewSummary));
export const usePage = (slug) =>
  useQuery(contentQuery(queryKeys.content.page(slug), () => getPage(slug), { enabled: Boolean(slug) }));

export const useSiteSettings = () => useQuery(contentQuery(queryKeys.settings.site(), getSiteSettings));
export const useDeliveryZones = () => useQuery(contentQuery(queryKeys.settings.zones(), listDeliveryZones));

// Inbound forms. Nothing to invalidate: anon can't read these tables.
export const useSubscribe = () => useMutation({ mutationFn: subscribe });
export const useSendContactMessage = () => useMutation({ mutationFn: sendContactMessage });
