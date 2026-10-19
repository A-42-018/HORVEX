# HORVEX — Progress Tracker

Phase specs: `roadmap.md` §14 · Session starter: `PHASE_PROMPT.md` · Project rules: `CLAUDE.md` · Archive: `docs/history.md` (old notes + decisions; don't read it for block B)

## Next Up
**B14b — Gallery (mobile): done (build + lint pass). Next: B15a — Variants & stock (Sonnet). Still pending 👤/browser: browser checks for B1a–B14b, and apply migration `20261020100000_b3c_courier_partners.sql`.**

## Status
Statuses: `todo` · `in progress` · `blocked (👤 you)` · `done`

**Done:** 0 Project setup · A1 Design tokens & fonts · A2 Core primitives & style guide · A3 Database schema & RLS · A4 Order engine & seed data · A5 Data layer & client state · A6 Admin auth & admin patterns

| ID | Phase | Model | Status |
|---|---|---|---|
| B1a | Announcement bar | Sonnet | in progress |
| B1b | Desktop header | Sonnet | in progress |
| B2a | Mega menu | Sonnet | in progress |
| B2b | Search overlay | Sonnet | in progress |
| B2c | Search extras | Sonnet | in progress |
| B3a | Mobile header & menu | Sonnet | in progress |
| B3b | Bottom tab bar & FAB | Sonnet | in progress |
| B3c | Footer | Sonnet | in progress |
| B4a | Cart drawer | Sonnet | in progress |
| B4b | Toasts & add-to-bag | Sonnet | in progress |
| B5a | Product card | Sonnet | in progress |
| B5b | Product grid | Sonnet | in progress |
| B6a | Hero slider | Sonnet | in progress |
| B6b | Trust marquee | Sonnet | in progress |
| B7a | Category tiles | Sonnet | in progress |
| B7b | Featured tabs | Sonnet | in progress |
| B8a | Anatomy (static) | Sonnet | in progress |
| B8b | Him / Her | Sonnet | in progress |
| B9a | Brand film | Sonnet | in progress |
| B9b | Promo banners | Sonnet | in progress |
| B10a | Reviews | Sonnet | in progress |
| B10b | How-to-Order & Instagram | Sonnet | in progress |
| B11a | Join & FAQ | Sonnet | in progress |
| B11b | Section wiring | Sonnet | in progress (browser check pending) |
| B11c | Template cleanup | Sonnet | done |
| B12a | Listing pages | Sonnet | done |
| B12b | Sort & URL sync | Sonnet | done |
| B13a | Filters (desktop) | Sonnet | done |
| B13b | Filters (mobile) | Sonnet | done |
| B14a | Gallery (desktop) | Sonnet | done |
| B14b | Gallery (mobile) | Sonnet | done |
| B15a | Variants & stock | Sonnet | todo |
| B15b | Buy actions | Sonnet | todo |
| B15c | Sticky buy bar | Sonnet | todo |
| B16a | PDP tabs | Sonnet | todo |
| B16b | PDP reviews | Sonnet | todo |
| B16c | Related & recent | Sonnet | todo |
| B17a | Wishlist page | Sonnet | todo |
| B17b | Cart page | Sonnet | todo |
| B18a | Checkout form | Sonnet | todo |
| B18b | Checkout totals | Sonnet | todo |
| B19a | Place order | Sonnet | todo |
| B19b | Track order | Sonnet | todo |
| B20a | About & Contact | Sonnet | todo |
| B20b | FAQ, policies, 404 | Sonnet | todo |
| B21a | Admin shell | Sonnet | todo |
| B21b | Dashboard | Sonnet | todo |
| B21c | New-order alert | Sonnet | todo |
| B22a | Products list | Sonnet | todo |
| B22b | Product editor | Sonnet | todo |
| B23a | Product images | Sonnet | todo |
| B23b | Variants editor | Sonnet | todo |
| B24a | Admin categories | Sonnet | todo |
| B24b | Admin collections | Sonnet | todo |
| B25a | Orders table | Sonnet | todo |
| B25b | Order detail | Sonnet | todo |
| B25c | Order actions | Sonnet | todo |
| B26a | Invoice | Sonnet | todo |
| B26b | Export & customers | Sonnet | todo |
| B27a | Section builder | Sonnet | todo |
| B27b | Hero & promos | Sonnet | todo |
| B28a | Announcements & FAQ | Sonnet | todo |
| B28b | Pages editor | Sonnet | todo |
| B28c | Review moderation | Sonnet | todo |
| B29a | Coupons & zones | Sonnet | todo |
| B29b | Site settings | Sonnet | todo |
| B29c | Users & activity | Sonnet | todo |
| C1 | Signature motion I | Opus | todo |
| C2 | Signature motion II | Opus | todo |
| C3 | SEO & analytics | Opus | todo |
| C4 | Performance & a11y audit | Opus | todo |
| C5 | Security & code review | Opus | todo |
| C6 | QA, launch & handover | Opus | todo |

## Block B context (what block A left you)
- Primitives in `components/common` (Button, Badge, Card, Container, SectionHeading, IconButton, Input, Select, Drawer, Modal, Skeleton, Price, Rating). Drawer/Modal share `DialogShell` (native `<dialog>`, ESC, focus trap) and take `tone="dark" | "ivory"`.
- Colours: use the surface-aware tokens (`fg`, `muted`, `surface`, `raised`, `line`, `brand`, `focus`, …); `.section-ivory` / `.section-dark` flip them. Type roles are single classes (`text-h2`, `text-eyebrow`, …). Motion constants are in `lib/motion.js`.
- `lib/format.js` (`formatTaka`, phone helpers, dates), `lib/strings.js` for UI copy. Icons: `lucide-react`, `size={20} strokeWidth={1.5}`.
- Data: services → hooks → components (see `CLAUDE.md`). Engine error tokens and limits: `supabase/README.md`. `/style-guide` (dev only) shows every primitive.
- Admin: `RequireRole`, `useAdminMutation` / `useAdminCrud`, `useImageUpload` are written but untested against live writes until B22b/B23a.
- Port 5173 busy? Use the `horvex-dev-alt` preview (5174).

## Session Notes
Newest first, 3–5 lines each: what was done, anything deferred, anything the next phase must know. For an unfinished phase, list what's done and what's left. **Keep only the 5 newest entries here**; move older ones to `docs/history.md`.

- **B14b (done):** `ProductGallery` below `lg` is now a native scroll-snap swipe carousel (`MobileCarousel`: dots, tap opens lightbox, scroll position ↔ `index` synced both ways); desktop viewer/thumbs are `lg+` only (thumbs no longer shown on mobile; dots replace them). `GalleryLightbox` gained touch gestures via pointer events: swipe to change image, two-finger pinch zoom (1–4x), drag-pan when zoomed (bounded), double-tap toggles 2.5x; mouse behaviour unchanged. No new strings/deps. B15a: put variant→image change through `ProductGallery`'s `index` (lift state or add an `activeImageUrl` prop) when wiring the picker.
  Verified: `npm ci`, build, lint (no new warnings). Not browser-checked (375px swipe + dots, pinch/double-tap on a real touch device, lightbox swipe at 1x vs zoomed, 1-image product, desktop unchanged at 1440px). No git repo in the zip, so not committed.

- **B14a (done):** New `product/ProductGallery.jsx` (vertical thumbs + large 4:5 image on `lg+`, studio shots before lifestyle; mouse-only hover lens = `scale(2.2)` transform following the pointer; prev/next buttons, thumbs and click/Enter all work without hover) and `product/GalleryLightbox.jsx` (on `DialogShell`, full-screen; ←/→/Home/End change image, +/− or click toggle 2.5x zoom with pointer pan, counter). Added `strings.product.gallery`. New minimal `pages/Product.jsx` replaces the `product/:slug` placeholder (loading/error/NotFound, gallery + H1 only). **B14b:** below `lg` the gallery currently shows image + horizontal thumbs; add swipe carousel, dots, pinch zoom in `ProductGallery`/lightbox. B15+ fill the buy-box column in `Product.jsx`.
  Verified: `npm ci`, build, lint (no new warnings). Not browser-checked (hover lens at 1440px, lightbox keys/focus return, product with 1 image, seed slug).

- **B13b (done):** New `shop/MobileFilters.jsx`: below `lg` a "Filters (n)" button (next to sort) opens a `Drawer` (bottom sheet, ivory) holding `FilterPanel` bound to a **draft** copy of the URL filters (re-seeded on open). Footer: "Reset" (clears draft) + "Apply (n)" where n = live result count for the draft (`useTotal(filters)` prop, `limit: 1` query per listing type: shop/category/collection, defined in `Listing.jsx`); Apply commits all filter keys in one `view.update` (resets `page`). `ActiveChips` now shows at all sizes. Added `strings.listing.filters.{buttonCount, apply, applyCount, reset}`.
  Verified: `npm ci`, build, lint (no new warnings). Not browser-checked (375px sheet scroll, Apply count vs results, draft discarded on close, tablet md+ right-panel layout).

- **B13a (done):** URL-synced filters: `useListingParams` now parses `category, gender, min, max, strap, movement, stock` into `filters` (the `listProducts` shape) and exposes `update`, `toggle`, `activeCount`, `hasFilters`; any change resets `page`; `clear` drops filters + page but keeps `sort`. `listProducts` gained `strap`/`movement` (arrays of `FILTER_OPTIONS` keys → `specs->>…` ILIKE, OR within facet) and `inStock`; collections accept `filters`. New `shop/FilterPanel` (category radios on /shop only, gender, dual price slider `PriceRange` 0–12000 step 500, strap, movement, in-stock), `shop/ActiveChips`; `Listing.jsx` has a sticky `lg+` sidebar + chips. **B13b:** reuse `FilterPanel`/`ActiveChips` inside a bottom sheet (`Drawer`) with "Apply (n)" (panel currently applies instantly; use a draft copy of params) and show chips below `lg`. Dial-colour facet skipped: no dial-colour data exists (only variant swatches); add when the DB has it.
  Verified: `npm ci`, build, lint (no new warnings). Not browser-checked (combine filters + sort, shared URL, slider keyboard, 1440px sticky sidebar).

- **B12b (done):** New `hooks/useListingParams.js` (`?sort=` validated against `PRODUCT_SORTS`, `?page=N` = pages shown, capped 20; `replace` navigation, no scroll reset; exposes `sort, limit, hasParams, setSort, loadMore, clear`). New `shop/SortSelect.jsx`, `shop/ListingEmpty.jsx`; added `bestselling` sort to `services/products.js`. `Listing.jsx` shows "Showing n of total", sort select, "Load more" (refetches `page*24` from offset 0, previous items kept), empty state ("Clear filters" if params, else "Browse all watches"). Collections: no `sort` param keeps the hand-picked order; choosing "Featured" removes the param. B13 should add filter params via `useListingParams`' `update` (not exported yet: export it or extend the hook) and reset `page` on filter change.
  Verified: `npm ci`, build, lint (only pre-existing warnings). Not browser-checked (shared URL with `?sort=price-asc&page=2` reproduces view; 375px sort row).

## Decisions
New decisions from block B go here (one line each). Earlier decisions are in `docs/history.md`; the ones that matter day to day are already in `CLAUDE.md`.
