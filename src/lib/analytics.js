// Analytics entry point. Components and stores call track(); C3 wires it to
// GA4 + Meta Pixel (ids from site_settings). Until then it only logs in dev.

// GA4 recommended e-commerce event names, so C3 can forward them unchanged.
export const EVENTS = {
  viewItem: "view_item",
  viewItemList: "view_item_list",
  addToCart: "add_to_cart",
  removeFromCart: "remove_from_cart",
  addToWishlist: "add_to_wishlist",
  beginCheckout: "begin_checkout",
  purchase: "purchase",
  search: "search",
};

/** track(EVENTS.addToCart, { item_id, item_name, price, quantity }) */
export function track(event, params = {}) {
  if (import.meta.env.DEV) console.debug("[track]", event, params);
}
