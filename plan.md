# WRISTORY — Progress Tracker

Phase specs: `roadmap.md` §14 · Session starter: `PHASE_PROMPT.md` · Project rules: `CLAUDE.md` · Archive: `docs/history.md` (old notes + decisions; don't read it for block B)

## Next Up
**C6 — QA, launch & handover (Opus). C1–C5 are done (C4 on branch `claude/objective-curran-a33419` until merged). Read `docs/history.md` first (block C rule). First: `npm ci && npm run build && npm run lint`. On deploy: `vercel.json` now falls back to `/app.html` (C4); run Lighthouse on the live URL + a real mid-range Android (C4 measured only locally). Pending 👤: apply `20261020100000_b3c_courier_partners.sql` (unconfirmed), then `20261021100000_c5_security.sql`, run `c5_security_check.sql`, `b29b_settings_check.sql`, `b29c_users_check.sql`; C3 live checks + real GA4/Pixel IDs + `VITE_SITE_URL`; delete test data (orders HVX-10001/10002, product `QA Test Watch`); fix leftover HORVEX copy in DB content (run `20261022100000_rebrand_wristory_copy.sql`).**

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
| B15a | Variants & stock | Sonnet | done |
| B15b | Buy actions | Sonnet | done |
| B15c | Sticky buy bar | Sonnet | done |
| B16a | PDP tabs | Sonnet | done |
| B16b | PDP reviews | Sonnet | done |
| B16c | Related & recent | Sonnet | done |
| B17a | Wishlist page | Sonnet | done |
| B17b | Cart page | Sonnet | done |
| B18a | Checkout form | Sonnet | done |
| B18b | Checkout totals | Sonnet | done |
| B19a | Place order | Sonnet | done |
| B19b | Track order | Sonnet | done |
| B20a | About & Contact | Sonnet | done |
| B20b | FAQ, policies, 404 | Sonnet | done |
| B21a | Admin shell | Sonnet | done |
| B21b | Dashboard | Sonnet | done |
| B21c | New-order alert | Sonnet | done |
| B22a | Products list | Sonnet | done (unverified) |
| B22b | Product editor | Sonnet | done (unverified in browser) |
| B23a | Product images | Sonnet | done (unverified in browser) |
| B23b | Variants editor | Sonnet | done (unverified in browser) |
| B24a | Admin categories | Sonnet | done (unverified in browser) |
| B24b | Admin collections | Sonnet | done (unverified in browser) |
| B25a | Orders table | Sonnet | done (unverified in browser) |
| B25b | Order detail | Sonnet | done (unverified in browser) |
| B25c | Order actions | Sonnet | done (unverified in browser) |
| B26a | Invoice | Sonnet | done (unverified in browser) |
| B26b | Export & customers | Sonnet | done (unverified in browser) |
| B27a | Section builder | Sonnet | done (unverified in browser) |
| B27b | Hero & promos | Sonnet | done (unverified in browser) |
| B28a | Announcements & FAQ | Sonnet | done (unverified in browser) |
| B28b | Pages editor | Sonnet | done (unverified in browser) |
| B28c | Review moderation | Sonnet | done (unverified in browser) |
| B29a | Coupons & zones | Sonnet | done (unverified in browser) |
| B29b | Site settings | Sonnet | done (unverified in browser) |
| B29c | Users & activity | Sonnet | done (unverified in browser) |
| C1 | Signature motion I | Opus | done |
| C2 | Signature motion II | Opus | done |
| C3 | SEO & analytics | Opus | done (👤 live checks: rich-results test, Pixel Helper) |
| C4 | Performance & a11y audit | Opus | done (mobile Lighthouse 79–87 locally, see note; 👤 measure on the live site + a real phone) |
| C5 | Security & code review | Opus | done (👤 apply `20261021100000_c5_security.sql`, run `c5_security_check.sql`) |
| C6 | QA, launch & handover | Opus | todo |

## Block B context (what block A left you)
- Primitives in `components/common` (Button, Badge, Card, Container, SectionHeading, IconButton, Input, Select, Drawer, Modal, Skeleton, Price, Rating). Drawer/Modal share `DialogShell` (native `<dialog>`, ESC, focus trap) and take `tone="dark" | "ivory"`.
- Colours: use the surface-aware tokens (`fg`, `muted`, `surface`, `raised`, `line`, `brand`, `focus`, …); `.section-ivory` / `.section-dark` flip them. Type roles are single classes (`text-h2`, `text-eyebrow`, …). Motion constants are in `lib/motion.js`.
- `lib/format.js` (`formatTaka`, phone helpers, dates), `lib/strings.js` for UI copy. Icons: `lucide-react`, `size={20} strokeWidth={1.5}`.
- Data: services → hooks → components (see `CLAUDE.md`). Engine error tokens and limits: `supabase/README.md`. `/style-guide` (dev only) shows every primitive.
- Admin: `RequireRole`, `useAdminMutation` / `useAdminCrud`, `useImageUpload` are written but untested against live writes until B22b/B23a.
- Port 5173 busy? Use the `wristory-dev-alt` preview (5174).

## Session Notes
Newest first, 3–5 lines each: what was done, anything deferred, anything the next phase must know. For an unfinished phase, list what's done and what's left. **Keep only the 5 newest entries here**; move older ones to `docs/history.md`.

- **Fix: category tiles + leftover HORVEX copy (2026-10-22):** Category tile names now use the Cormorant serif like the other home headings (`text-h2` on mobile, new `text-h4` token on lg+ so "Automatic & Skeleton" fits 5 columns), "Shop now" no longer wraps. The tab title / "Anatomy of a HORVEX" / About / hero eyebrow / product descriptions come from DB rows: 👤 run `supabase/migrations/20261022100000_rebrand_wristory_copy.sql` in the SQL editor (text-only `replace`, idempotent). Verified 375 / 1024 / 1280 / 1440, build + lint clean.
- **C4 Performance & a11y audit (done, 2026-10-20):** Measured on the production build (`npm run build` + `vite preview`, config `wristory-c4-preview` on 5187) with Lighthouse 12 CLI (npx, headless Chrome). **Storefront initial JS 309 → 180 kB gz** (target < 200), no > 500 kB chunk warning left. How: (1) the storefront Supabase client is now a bare `PostgrestClient` (`@supabase/postgrest-js`, pinned 2.118.0 = supabase-js's own copy); auth / storage / realtime only load with the admin (`adminClient.js` builds the full client itself). The publishable key is sent as `?apikey=` (no custom headers) so reads skip the CORS preflight (halved API latency on first load). (2) Every page except home is a route `lazy` chunk (`app/routeChunks.js`; listing, product and cart chunks are prefetched on idle after `load`, skipped on Save-Data/2G); zod + react-hook-form now load only with checkout/contact. (3) Admin copy moved out of `lib/strings.js` into `admin/strings.js` (admin code imports `strings` from there: store copy + `strings.admin`; −73 kB raw from the store). (4) sonner loads on first toast (`Toaster` lazy, `cartActions` imports it on use). (5) Admin pages are `React.lazy` chunks with a `<Suspense>` spinner in `AdminLayout` (+ one in `AdminApp` for the print view).
  **LCP / CLS:** `index.html` preconnects to Supabase + Unsplash and preloads the display font (Cormorant latin normal); `scripts/prerender.mjs` now writes a preload for hero slide 1 into `dist/index.html` (home only) and a clean `dist/app.html`, which `vercel.json` now uses as the SPA fallback (and `vite.config.js` mirrors this for `vite preview`, incl. `/faq` → `faq/index.html`). Hero: hidden slides no longer download their images with the LCP image (each mounts from the slide before it); hero sources moved to `lib/images.js` (`heroSources`, `heroPreloads`, mobile widths now include 828/1242). `<main>` is `min-h-svh` so the footer can't jump when a lazy page or its data arrives (CLS was 0.7–0.98 on PDP/shop/checkout, now ≤ 0.06). Images were already `srcset`/`sizes`/lazy; Unsplash `auto=format` already serves **AVIF** (checked). a11y: listing had h1 → h3 on mobile (sidebar h2 hidden) → sr-only "Products" h2.
  **Results (local, Lighthouse mobile = simulated slow 4G + 4× CPU):** home 79 / PDP 83 / shop 83 / checkout 87 performance (LCP 3.6–4.7 s, FCP 2.3 s, CLS ≤ 0.06, TBT ≤ 100 ms); desktop home 90, PDP 96. Accessibility 100 and Best Practices 100 on home, shop, PDP, category, about, contact, FAQ, policy, track, cart, wishlist, checkout, 404; SEO 100 on indexable pages (63 = intended `noindex`). Keyboard/SR pass: skip link first and visible, cart + search dialogs trap focus, ESC closes, focus returns to the trigger, icon buttons named, checkout errors set `aria-invalid` + `aria-describedby` and focus the first field, no overflow at 375px, no console errors (two "preloaded but not used" warnings seen in the hidden preview pane).
  **Gap (honest):** mobile Performance ≥ 90 isn't met under Lighthouse's simulated slow 4G: the SPA paints only after ~180 kB JS (FCP 2.3 s) and the hero's AVIF shares the 1.6 Mbps link. Not measured: real mid-range Android on 4G, field LCP/INP, the live Vercel site (CDN, HTTP/2, `/app.html` fallback). Next levers if needed: a static HTML shell for first paint, lazy below-the-fold home sections (embla), `font-display: optional` for the italic. Not done: Hind Siliguri ৳ subset (system Bengali font renders it fine), admin-uploaded images (Supabase Storage) have no resizing / AVIF (WebP only; image transforms need a paid plan). Build + lint OK (0 errors, same 11 warnings).
- **C5 Security & code review (done, 2026-10-21):** Audited every table, policy, function and grant in `supabase/migrations`, the storage policies, `src/` (auth, services, uploads, CSV, links, storage), secrets (working tree, `.env` key is the publishable one, git history, committed zips: clean) and deps. **Fixed (high):** any admin, staff included, could rewrite an order's totals, coupon or customer details through the API → column grants, only `status`/`courier`/`tracking_id`/`admin_note`; cancelled → pending → cancelled restocked twice → `orders.stock_restored` flag. **Fixed (medium):** `track_order` misses limited (20/phone/day, 30/IP/hour, new `rate_limited` copy on the track page), coupon guessing limited (10 misses/IP/hour via `quote_order` and `place_order`; misses come back as `{ error }` so the counter survives, `services/orders.js` rethrows), contact/newsletter flooding (5/IP/10 min). `place_order` is now a wrapper over `place_order_checked`: **change order logic in `place_order_checked`**. Removed `/style-guide`; `npm audit fix` (source-map-js); `vercel.json` adds HSTS + Permissions-Policy.
  **Migration `20261021100000_c5_security.sql`** + test `supabase/tests/c5_security_check.sql` (abuse cases on `place_order`, privileges, limits, restock-once; rolls back); README "Security hardening". All six SQL tests (a3, a4, b29b, b29c, restock, c5) pass against the full migration chain in PGlite with Supabase stubs, and the c5 test fails when each fix is reverted. **Pending 👤 (in order):** apply `20261020100000_b3c_courier_partners.sql` if not yet, then `20261021100000_c5_security.sql`, then run `tests/c5_security_check.sql` ("C5 security checks passed"). In Supabase Auth: turn off public sign-ups, turn on leaked-password protection, change the owner's weak password; optional owner TOTP (§9.4, not built).
  **Open (not high):** remaining `npm audit` highs are all inside `tailwindcss@3` (braces/micromatch/chokidar, build-time only, fix = Tailwind 4 migration); no CSP yet (add in C6 once C3's analytics origins are final); activity log for prices/orders is still client-side (order status has the DB history); stray `HORVEX-*.zip` and `plan.md-E` in the repo root (no secrets; C6 cleanup); anyone who knows a phone can use up its 20 track misses for the day. Verified: build, lint (0 errors, same 12 warnings), browser desktop + 375px: `/style-guide` is the 404, track page (miss, mocked `rate_limited`), checkout coupon (real 400 path and mocked soft-error path), no new console errors.
- **C3 SEO & analytics (done, 2026-10-20; build + lint OK, 0 errors, same 12 warnings; browser checked desktop + 375px, no console errors):** `lib/seo.js` = pure head-tag + JSON-LD builders shared by `components/seo` (`<Seo>`: title, description, canonical, robots, OG/Twitter, product price; `<JsonLd>`) and the new post-build `scripts/prerender.mjs` (`npm run build` = `vite build && node scripts/prerender.mjs`). Every storefront page renders one `<Seo>` (defaults from `site_settings` `seo_title` / `seo_desc` / `og_image_url` / `brand_name`; cart, checkout, wishlist, order success, track order, 404 and maintenance are `noindex`). JSON-LD: Organization + WebSite (search → `/shop?search=`) on home, Product + Offer/AggregateOffer (BDT, stock) + AggregateRating (approved reviews) + BreadcrumbList on PDP, BreadcrumbList on listings, FAQPage on `/faq`. Prerender writes `dist/<route>/index.html` (head only, body still SPA) for shop, faq, contact, about, policies, every category / collection / product, plus `sitemap.xml` and `robots.txt` (`public/robots.txt` blocks /admin, /checkout, /cart, /wishlist, /order/, /track-order); `index.html` tags carry `data-seo` and `main.jsx` removes them before React renders. Analytics: `lib/analytics.js` loads GA4 (gtag) + Meta Pixel from the `ga4_id` / `fb_pixel_id` settings via `hooks/useStoreAnalytics.js` in `StoreLayout` (never on /admin; nothing loads while both are empty; early events queued), page view per route, GA4 events forwarded with BDT `items`, Pixel mapped (ViewContent, AddToCart, AddToWishlist, InitiateCheckout, Purchase with `eventID` = order number, Search, Lead). New events: `view_item` (PDP), `begin_checkout`; `remove_from_cart` now sends price.
  **👤 Pending:** set `VITE_SITE_URL` (live domain, see `.env.example`) in Vercel, else the Vercel production domain is used and local builds skip sitemap/canonicals; enter real GA4 + Pixel IDs in `/admin/settings`; upload a share image there (no OG image otherwise); after deploy run Google's Rich Results Test on a product + `/faq`, check Pixel Helper / GA4 DebugView, submit `sitemap.xml` in Search Console. DB copy still says HORVEX (site `seo_title`/`seo_desc`, About), which now shows in titles and previews.
  **Notes:** prerendered heads are a build-time snapshot (price/new products update on the next deploy; a Vercel deploy hook after admin edits would fix it). `vite preview` serves the SPA fallback for `/faq` (only `/faq/` hits the prerendered file); Vercel serves `faq/index.html` for `/faq`. No consent banner (none required in BD). Not done: apple-touch-icon / monogram PNGs (need the client logo), Conversions API (phase 2). C5: a CSP must allow googletagmanager.com, google-analytics.com, connect.facebook.net, facebook.com.
- **C2 Signature motion II (done, 2026-10-20):** No new deps (no GSAP: the anatomy pin is CSS `sticky` + `subscribeScroll`). **Anatomy** (§7 #11): on `MEDIA.pinned` (lg, ≥700px tall, mouse, no reduced motion) the section is 220vh with a sticky inner; progress starts when its top reaches mid-viewport, strokes draw (staggered `stroke-dashoffset`, `pathLength=1`), then callouts + markers fade/rise in one by one; styles written straight to the DOM. Elsewhere the drawing draws once in view (`animate-stroke-draw`); reduced motion = static. **Fly-to-bag** (#9): `lib/flyToBag.js` (WAAPI arc to the visible `[data-bag-target]`, then `[data-bag-count]` bounces); `addToBag(product, options, { from })` opens the drawer after the flight, at once when reduced / no bag icon on screen (desktop header hidden after scrolling down). Wired on product cards and the PDP Add to Bag. **HeartBurst** (#10, cards + PDP), **RollingNumber** (#13, reviews average), **SuccessCheck** (#15, order success) in `components/motion/`. New keyframes `heart-pop/heart-particle/stroke-draw/check-pop` in `tailwind.config.js`; values in `MOTION` (`flyDuration`, `counterStagger`, `anatomyPinVh`, …).
  Reveals (#7): `Reveal` now transitions transform/opacity only, 700ms expo-out; grids use `staggerDelay` (6 × 60ms cap). #6 marquee and #8 card hover were already done in B. **Reduced-motion pass:** JS motion that the CSS override can't reach now checks it: Embla arrows jump (`scrollPrev(true)`), PDP gallery dots scroll `auto`, fly-to-bag skipped; `useInView` uses `lib/motion`'s `prefersReducedMotion`. Decision: `stroke-dashoffset` on the two small inline SVGs is the one non-transform/opacity animation (the roadmap asks for a line draw).
  Verified: build, lint (0 errors, 11 warnings, unchanged), browser at 1280×800 + 375px: pin progress values + screenshots, mobile one-shot draw, fly-to-bag on card (desktop → header bag, mobile → header bag) and PDP, drawer opens after, heart particles, digit roll, success ring/check mid-animation, no overflow at 375px, no console errors; reduced motion checked by stubbing `matchMedia` (JS paths only; the CSS `@media` override wasn't emulated). **Not verified:** real devices / 60fps, real OS reduced-motion setting.
- **C1 Signature motion I (done, 2026-10-20):** No new deps (`motion` + `lenis` were already installed). New `components/motion/`: `Preloader` (once per session via `sessionStorage` `wristory-preloaded`; 60 bezel ticks fill in ~0.9s, wordmark fades up, `pointer-events-none`, skipped under reduced motion; sets `html.is-preloading`, which holds the hero headline reveal), `SmoothScroll` (Lenis, fine pointer + no reduced motion only, lazy chunk 5 kB gz; dialogs and nested scrollers scroll natively; drops momentum on navigation), `RouteTransition` (CSS 250ms fade + 8px rise, enter-only, keyed by pathname, not on first load; `backwards` fill so fixed children stay fixed), `MaskReveal` (hero headline, words grouped by measured line, 80ms stagger), `LightSweep` (`loop` every 6s on the active hero slide; `hover` single pass on `ProductCard` images), `BezelRing` (hero, lg+, rotates 0.04°/px of scroll), `Parallax` (hero, category tiles, brand film; 0.85×, desktop only, 15% bleed and capped), `Magnetic` (hero CTA, mouse only, max 6px). Keyframes live in `tailwind.config.js` (`animate-route-enter/mask-rise/light-sweep/fade-in/fade-out`); `.mask-word` CSS in `index.css`.
  **For C2:** `lib/motion.js` now has `MOTION` (stagger, parallax, magnetic, sweep values), `MEDIA`, `prefersReducedMotion`, `clamp`, `staggerDelay` (6 × 60ms cap) and `subscribeScroll` (one shared rAF-throttled window scroll listener; it sees Lenis's smoothed position). Hooks: `hooks/useMotionPrefs.js` (`useReducedMotion`, `useSmoothScrollAllowed`, `useDesktopMotion`). Avoid motion's `m.*` + `useScroll` for scroll-linked styles: without `LazyMotion` the `m` components don't render motion-value updates, and `useScroll` didn't deliver updates here, so C1 writes transforms directly. Hero now uses `useReducedMotion` (one lint warning fewer).
  Verified: build, lint (0 errors, 11 warnings), browser at desktop (1024) + 375px: preloader once per session, mask reveal (line grouping checked by narrowing the heading), ring + parallax values follow scroll, Lenis wheel scroll, page doesn't scroll behind the cart drawer, route transition, back/forward scroll restoration, card hover sweep, no overflow at 375px, no console errors. **Not verified:** real 60fps on a mid-range Android (no device here; mobile only gets CSS transform/opacity animations, no JS scroll work), reduced-motion in the browser (code paths gate on it), Lenis feel on a real trackpad (the preview pane was hidden, rAF throttled).

## Decisions
New decisions from block B go here (one line each). Earlier decisions are in `docs/history.md`; the ones that matter day to day are already in `CLAUDE.md`.
- `men`/`women` category slugs always resolve to a gender filter (`categoryScope`), on listings and in collection rules.
- Rule collections narrow user filters: price ranges intersect; gender/category/featured/bestseller/badge rules override the URL.
- C4: the storefront reads Supabase through a bare `PostgrestClient` with the key in `?apikey=` (no preflight); only admin code may use supabase-js `createClient`.
- C4: every storefront page except home is a lazy route chunk (`app/routeChunks.js`); new pages go there too. Admin copy lives in `admin/strings.js`.
- C4: `dist/app.html` is the SPA fallback (`vercel.json`); `dist/index.html` is home only (hero preload).
- Checkout district: only the zone named "Outside Dhaka" (`isOutsideDhaka`) asks for a district; every other zone sends "Dhaka". Revisit if admin zones (B29a) need a per-zone flag.
- `site_settings` stays owner-only in RLS. Managers write only the announcement list and the free-delivery amount, through the `set_announcements` / `set_free_delivery_threshold` security-definer functions (B29b). Maintenance mode is enforced in `place_order` (`maintenance` token) and by `StoreLayout` on the storefront.
- Delivery zones with orders are switched off, never deleted (the FK nulls `orders.zone_id`); the last active zone always stays on. Revisit the name-based district rule (`isOutsideDhaka`) if zones need a flag.
- Cancel/return gives stock and the coupon use back in the database (`orders_restock_on_cancel` trigger), only on the first move into cancelled/returned; a line whose variant was deleted isn't credited to the product. Moving an order back out of cancelled/returned does not re-take stock.
