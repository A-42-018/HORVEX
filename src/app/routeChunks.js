// Lazy page chunks. Kept in one place so the router and the idle prefetch
// (prefetchPageChunks) load the same modules.
export const routeChunks = {
  listing: () => import("../pages/Listing"),
  product: () => import("../pages/Product"),
  wishlist: () => import("../pages/Wishlist"),
  cart: () => import("../pages/Cart"),
  checkout: () => import("../pages/Checkout"),
  orderSuccess: () => import("../pages/OrderSuccess"),
  trackOrder: () => import("../pages/TrackOrder"),
  about: () => import("../pages/About"),
  contact: () => import("../pages/Contact"),
  faq: () => import("../pages/Faq"),
  policy: () => import("../pages/Policy"),
  // Customer accounts: also the only chunk that loads the customer auth client.
  account: () => import("../pages/account"),
  notFound: () => import("../pages/NotFound"),
};

/**
 * Warms the chunks most visits need next (listing, product, cart) once the
 * browser is idle, so the first click doesn't wait on the network.
 * Skipped on Save-Data / 2G connections.
 */
export function prefetchPageChunks() {
  const connection = navigator.connection;
  if (connection?.saveData || /2g/.test(connection?.effectiveType ?? "")) return;
  const run = () => [routeChunks.listing, routeChunks.product, routeChunks.cart].forEach((load) => load().catch(() => {}));
  if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2000);
}
