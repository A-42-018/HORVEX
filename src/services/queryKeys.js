// React Query key factory. Every server read uses a key from here, never an
// inline array, so caching and invalidation stay predictable.
//
// Shape: [domain, kind, ...params]
// - `domain` is the invalidation scope. Admin mutations invalidate a whole
//   domain, e.g. queryClient.invalidateQueries({ queryKey: queryKeys.products.all }).
// - `kind` names the read (list, detail, …).
// - params are plain serializable values (objects are hashed by value).
// - Admin reads (drafts, hidden rows, orders) use the kind "admin" right after
//   the domain, e.g. ["products", "admin", "list", filters]. They share the
//   domain's invalidation but never a cache entry with the storefront, and are
//   dropped on sign-out (see isAdminKey).
export const queryKeys = {
  products: {
    all: ["products"],
    list: (filters = {}) => ["products", "list", filters],
    detail: (slug) => ["products", "detail", slug],
    // Sorted so the same set of ids hits the same cache entry.
    byIds: (ids) => ["products", "byIds", [...ids].sort()],
    reviews: (productId) => ["products", "reviews", productId],
  },
  categories: {
    all: ["categories"],
    list: () => ["categories", "list"],
    detail: (slug) => ["categories", "detail", slug],
  },
  collections: {
    all: ["collections"],
    list: () => ["collections", "list"],
    detail: (slug) => ["collections", "detail", slug],
    products: (slug, options = {}) => ["collections", "products", slug, options],
  },
  content: {
    all: ["content"],
    homeSections: () => ["content", "homeSections"],
    heroSlides: () => ["content", "heroSlides"],
    banners: (placement = null) => ["content", "banners", placement],
    faqs: () => ["content", "faqs"],
    testimonials: () => ["content", "testimonials"],
    recentReviews: (limit) => ["content", "recentReviews", limit],
    page: (slug) => ["content", "page", slug],
  },
  settings: {
    all: ["settings"],
    site: () => ["settings", "site"],
    zones: () => ["settings", "zones"],
  },
  auth: {
    all: ["auth"],
    profile: (userId) => ["auth", "profile", userId],
  },
  orders: {
    all: ["orders"],
    quote: (items, zoneId, couponCode) => ["orders", "quote", items, zoneId, couponCode ?? null],
    track: (phone, orderNumber) => ["orders", "track", phone, orderNumber],
  },
};

/** True for keys holding signed-in admin data (cleared on sign-out). */
export const isAdminKey = (queryKey) => queryKey[0] === "auth" || queryKey[1] === "admin";
