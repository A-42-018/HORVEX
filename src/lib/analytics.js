// Analytics entry point. Components and stores call track(); the storefront
// layout calls initAnalytics() once the site_settings ids are known and
// trackPageView() on every route change. GA4 gets the events unchanged (they
// already use GA4 names); Meta Pixel gets the mapped standard events below.
// Nothing loads on /admin, and nothing loads at all while both ids are empty.

// GA4 recommended e-commerce event names.
export const EVENTS = {
  viewItem: "view_item",
  viewItemList: "view_item_list",
  addToCart: "add_to_cart",
  removeFromCart: "remove_from_cart",
  addToWishlist: "add_to_wishlist",
  beginCheckout: "begin_checkout",
  purchase: "purchase",
  search: "search",
  generateLead: "generate_lead",
};

const CURRENCY = "BDT";
// Same formats the admin settings form accepts (B29b).
const GA4_ID = /^G-[A-Z0-9]{6,14}$/;
const PIXEL_ID = /^\d{8,20}$/;
const MAX_QUEUE = 50;

// GA4 name → Meta Pixel standard event (events not listed are GA4 only).
const PIXEL_EVENTS = {
  [EVENTS.viewItem]: "ViewContent",
  [EVENTS.addToCart]: "AddToCart",
  [EVENTS.addToWishlist]: "AddToWishlist",
  [EVENTS.beginCheckout]: "InitiateCheckout",
  [EVENTS.purchase]: "Purchase",
  [EVENTS.search]: "Search",
  [EVENTS.generateLead]: "Lead",
};

let status = "pending"; // pending → ready (ids known; possibly none)
let ids = { ga4: null, pixel: null };
let queue = [];
let lastPageKey = null;

/**
 * Single-item calls ({ item_id, item_name, price, quantity }) become the GA4
 * e-commerce shape: { currency, value, items: [...] }. Calls with `items` keep them.
 */
function toEcommerce(params) {
  if (params.items || !params.item_id) return params;
  const { item_id, item_name, item_variant, item_category, price, quantity = 1, ...rest } = params;
  const item = { item_id, item_name, item_variant, item_category, price, quantity };
  return { currency: CURRENCY, value: (price ?? 0) * quantity, ...rest, items: [item] };
}

function toPixel(event, params) {
  if (event === EVENTS.search) return { search_string: params.search_term };
  if (event === EVENTS.generateLead) return { content_name: params.method };
  const items = params.items ?? [];
  if (!items.length) return {};
  return {
    content_type: "product",
    content_ids: items.map((i) => i.item_id),
    contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1, item_price: i.price })),
    ...(items.length === 1 && { content_name: items[0].item_name }),
    num_items: items.reduce((n, i) => n + (i.quantity ?? 1), 0),
    value: params.value,
    currency: params.currency ?? CURRENCY,
  };
}

function send(kind, event, params) {
  if (ids.ga4) {
    window.gtag("event", kind === "page" ? "page_view" : event, params);
  }
  if (ids.pixel) {
    if (kind === "page") window.fbq("track", "PageView");
    else if (PIXEL_EVENTS[event]) {
      // eventID lets a future Conversions API sender (roadmap §12, phase 2) de-duplicate purchases.
      const args = ["track", PIXEL_EVENTS[event], toPixel(event, params)];
      if (params.transaction_id) args.push({ eventID: String(params.transaction_id) });
      window.fbq(...args);
    }
  }
}

function dispatch(kind, event, params) {
  if (import.meta.env.DEV) console.debug(`[${kind === "page" ? "page_view" : "track"}]`, event ?? "", params);
  if (status === "pending") {
    if (queue.length < MAX_QUEUE) queue.push([kind, event, params]);
    return;
  }
  send(kind, event, params);
}

function loadScript(src) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function loadGa4(id) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // Page views are sent by trackPageView (SPA routes); dev hits go to DebugView only.
  window.gtag("config", id, { send_page_view: false, ...(import.meta.env.DEV && { debug_mode: true }) });
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}

// Meta's base snippet, unminified.
function loadPixel(id) {
  if (!window.fbq) {
    const fbq = function fbq() {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    loadScript("https://connect.facebook.net/en_US/fbevents.js");
  }
  window.fbq("init", id);
}

/**
 * Called once with the ids from site_settings (empty or invalid ids load nothing).
 * Events tracked before this are queued, then sent or dropped.
 */
export function initAnalytics({ ga4Id, pixelId } = {}) {
  if (status === "ready" || typeof window === "undefined") return;
  const ga4 = String(ga4Id ?? "").trim().toUpperCase();
  const pixel = String(pixelId ?? "").trim();
  ids = { ga4: GA4_ID.test(ga4) ? ga4 : null, pixel: PIXEL_ID.test(pixel) ? pixel : null };
  if (ids.ga4) loadGa4(ids.ga4);
  if (ids.pixel) loadPixel(ids.pixel);
  status = "ready";
  const pending = queue;
  queue = [];
  if (ids.ga4 || ids.pixel) pending.forEach((args) => send(...args));
}

/** One page_view / PageView per navigation. `key` (location.key) skips StrictMode's repeat; GA4 reads document.title when `title` is omitted. */
export function trackPageView({ key, path, title }) {
  const pageKey = `${key}|${path}`;
  if (pageKey === lastPageKey) return;
  lastPageKey = pageKey;
  dispatch("page", null, { page_location: window.location.origin + path, page_path: path, ...(title && { page_title: title }) });
}

/** track(EVENTS.addToCart, { item_id, item_name, price, quantity }) */
export function track(event, params = {}) {
  dispatch("event", event, toEcommerce(params));
}
