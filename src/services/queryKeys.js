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
    related: (productId, limit) => ["products", "related", productId, limit],
    reviews: (productId) => ["products", "reviews", productId],
    search: (term, limit) => ["products", "search", term, limit],
    adminList: () => ["products", "admin", "list"],
    adminDetail: (id) => ["products", "admin", "detail", id],
    adminImages: (id) => ["products", "admin", "images", id],
    adminVariants: (id) => ["products", "admin", "variants", id],
  },
  categories: {
    all: ["categories"],
    list: () => ["categories", "list"],
    detail: (slug) => ["categories", "detail", slug],
    adminList: () => ["categories", "admin", "list"],
    adminRows: () => ["categories", "admin", "rows"],
  },
  collections: {
    all: ["collections"],
    list: () => ["collections", "list"],
    detail: (slug) => ["collections", "detail", slug],
    products: (slug, options = {}) => ["collections", "products", slug, options],
    adminRows: () => ["collections", "admin", "rows"],
    adminPicks: (id) => ["collections", "admin", "picks", id],
    adminCategories: () => ["collections", "admin", "categories"],
  },
  content: {
    all: ["content"],
    homeSections: () => ["content", "homeSections"],
    adminHomeSections: () => ["content", "admin", "homeSections"],
    adminHeroSlides: () => ["content", "admin", "heroSlides"],
    adminPromoBanners: () => ["content", "admin", "promoBanners"],
    adminFaqs: () => ["content", "admin", "faqs"],
    adminTestimonials: () => ["content", "admin", "testimonials"],
    adminAnnouncements: () => ["content", "admin", "announcements"],
    adminPages: () => ["content", "admin", "pages"],
    heroSlides: () => ["content", "heroSlides"],
    banners: (placement = null) => ["content", "banners", placement],
    faqs: () => ["content", "faqs"],
    testimonials: () => ["content", "testimonials"],
    recentReviews: (limit) => ["content", "recentReviews", limit],
    reviewSummary: () => ["content", "reviewSummary"],
    page: (slug) => ["content", "page", slug],
  },
  settings: {
    all: ["settings"],
    site: () => ["settings", "site"],
    zones: () => ["settings", "zones"],
    adminZones: () => ["settings", "admin", "zones"],
    adminRow: () => ["settings", "admin", "row"],
    adminThreshold: () => ["settings", "admin", "threshold"],
  },
  coupons: {
    all: ["coupons"],
    adminRows: () => ["coupons", "admin", "rows"],
  },
  auth: {
    all: ["auth"],
    profile: (userId) => ["auth", "profile", userId],
  },
  dashboard: {
    all: ["dashboard"],
    summary: () => ["dashboard", "admin", "summary"],
  },
  orders: {
    all: ["orders"],
    quote: (items, zoneId, couponCode) => ["orders", "quote", items, zoneId, couponCode ?? null],
    track: (phone, orderNumber) => ["orders", "track", phone, orderNumber],
    adminList: (filters) => ["orders", "admin", "list", filters],
    adminCounts: (filters) => ["orders", "admin", "counts", filters],
    adminDetail: (id) => ["orders", "admin", "detail", id],
    adminHistory: (id) => ["orders", "admin", "history", id],
  },
  users: {
    all: ["users"],
    adminList: () => ["users", "admin", "list"],
  },
  activity: {
    all: ["activity"],
    adminList: (filters) => ["activity", "admin", "list", filters],
    adminEntities: () => ["activity", "admin", "entities"],
  },
  customers: {
    all: ["customers"],
    adminList: (filters) => ["customers", "admin", "list", filters],
    adminOne: (phone) => ["customers", "admin", "one", phone],
  },
  reviews: {
    all: ["reviews"],
    adminList: (filters) => ["reviews", "admin", "list", filters],
    adminCounts: () => ["reviews", "admin", "counts"],
    adminProducts: () => ["reviews", "admin", "products"],
  },
};

/** True for keys holding signed-in admin data (cleared on sign-out). */
export const isAdminKey = (queryKey) => queryKey[0] === "auth" || queryKey[1] === "admin";
