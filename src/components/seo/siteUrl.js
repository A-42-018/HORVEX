// Canonical origin. Set VITE_SITE_URL to the live domain; preview deploys fall back to their own origin.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, "");
