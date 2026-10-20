import { useEffect } from "react";
import { useLocation } from "react-router";
import { initAnalytics, trackPageView } from "../lib/analytics";
import { useSiteSettings } from "./useContent";

/**
 * Storefront only (StoreLayout): loads GA4 / Meta Pixel with the ids saved in
 * admin settings and sends a page view per navigation. A failed settings load
 * loads nothing and drops the queued events.
 */
export function useStoreAnalytics() {
  const { data: settings, isSuccess, isError } = useSiteSettings();
  const settled = isSuccess || isError;
  const ga4Id = settings?.ga4_id;
  const pixelId = settings?.fb_pixel_id;
  useEffect(() => {
    if (settled) initAnalytics({ ga4Id, pixelId });
  }, [settled, ga4Id, pixelId]);

  const { key, pathname, search } = useLocation();
  useEffect(() => {
    trackPageView({ key, path: pathname + search });
  }, [key, pathname, search]);
}
