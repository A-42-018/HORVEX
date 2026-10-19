# HORVEX — history (archive)

Older session notes and the full decisions log, moved out of `plan.md` so phase sessions read less. Block B sessions don't need this file; read it only when a phase needs the background (block C should read it first).

## Open items for block C (from block A notes)
- C3: `monogram.svg`, logos, apple-touch-icon, OG image (or when the client supplies a logo).
- C4: split the 625 kB main chunk (supabase-js; lazy-load non-home routes). ৳ glyph renders from the system Bengali font; consider a tiny Hind Siliguri subset for U+09F3.
- C5: `track_order` / `quote_order` have no rate limit (order-number guessing, coupon enumeration). Move critical activity logs (orders, prices) to DB triggers. Owner TOTP 2FA (§9.4, optional).
- C6: replace placeholder photos (some show other brands' dials) and draft policy/FAQ copy with the client's.

## Session notes (archived)
### Phase A6 — Admin auth & admin patterns (done)
- 👤 Owner user + `admin_profiles` row (role `owner`) and a non-admin test user created; public sign-ups disabled. No "forgot password" flow: reset by recreating the user in the dashboard (noted on the login page).
- Two Supabase clients: the storefront `supabase` holds no session (RLS shows admins drafts, so a signed-in owner must still see the shop as a visitor); `services/adminClient.js` holds the admin session under `horvex-admin-auth`. `supabase.js` now exports `createServiceHelpers(client)`; admin services (`auth.js`, `admin.js`, `storage.js`) use the admin client and are imported only by admin code.
- `admin/auth/`: `AuthProvider` (session listener + profile query; status loading/signedOut/denied/error/admin; drops `auth` and `[domain, "admin", …]` queries on sign-out), `RequireAdmin` (→ `/admin/login` with `state.from`, refusal screen for non-staff), `RequireRole` + `roles.js` (`hasRole`; per-page min role: staff = dashboard/orders/customers, owner = settings/users, else manager). Login page signs non-staff straight back out. Layout: role-filtered nav, name · role, Sign out. Admin route got `HydrateFallback`.
- Helpers: `admin/hooks/useAdminMutation.js` (`useAdminMutation` = invalidate domains + quiet activity_log entry; `useAdminCrud(table)` = create/update/remove/reorder), `useImageUpload` → `services/storage.js` (`uploadImage` compresses to WebP ≤ 2000px with a lazily imported `browser-image-compression`, random file names, 1-year cache; `uploadFile`, `removeFiles`, `pathFromPublicUrl`).
- Verified: signed out → login (from remembered); owner signed in and landed back on `/admin/products` with all 12 nav items; admin client reads orders as `owner` while the storefront client stays anon (orders 42501); sign-out clears only the admin session; storefront still loads products; desktop + 375px, no overflow, no app console errors. Non-admin refusal: the code path signs them out with "doesn't have admin access" (user to confirm with the test account).
- For later: CRUD/upload helpers are untested against live writes (no admin screen yet) — B22/B23 exercise them first. Activity logging is client-side and best-effort; C5 could move critical logs (orders, prices) to DB triggers. Owner TOTP 2FA (§9.4, optional) not done — C5. Admin reads must use `[domain, "admin", …]` keys.

### Phase A5 — Data layer & client state (done)
- `services/`: `supabase.js` (client, `ServiceError`, `query` / `queryWithCount` / `rpc`), `products.js` (`listProducts` with category/gender/featured/bestseller/badge/price/search/ids/sort → `{ items, total }`, `getProduct`, `getProductsByIds`, reviews + `summarizeRatings`), `categories.js` (categories, collections, manual and rule collections), `content.js` (home sections, hero, banners, FAQs, testimonials, recent reviews, pages, subscribe/contact inserts), `settings.js` (site settings, zones), `orders.js` (quote/place/track) and `queryKeys.js`.
- Hooks: `hooks/useCatalog.js`, `useContent.js` (also settings/zones), `useOrders.js` (`useOrderQuote`, `usePlaceOrder` invalidates products, `useTrackOrder`). The QueryClient retries only errors without a code (network blips).
- Stores: `store/cart.js`, `wishlist.js`, `recentlyViewed.js` (persisted `horvex-*`, cross-tab sync), `ui.js` (overlays, not persisted). `lib/analytics.js` `track()` logs in dev only. Conventions are in `CLAUDE.md` → "Data & state conventions".
- Home: BestSellers (bestsellers) and NewArrivals (newest, All/Men/Women) load live products through `useProducts` via a temporary `HomeProductGrid` (skeleton / error + retry / empty). The template ProductCard now shows real images, `<Price>`, badges, the wishlist store and add-to-bag (products with variants link to the PDP). The navbar cart count is the real store count (it was a fake "2").
- Verified live: every service call against the seeded DB, `invalid_coupon` arrives as `error.code`; cart (3 items) and wishlist (2) survive a refresh and a new tab; desktop + 375px, no overflow, no console errors.
- For later: the main chunk is now 625 kB (supabase-js); C4 should split it (e.g. lazy-load non-home routes). The template card's add-to-bag only appears on hover/focus, so touch users can't reach it until B5. `src/data/products.js` is unused now (B11 removes it). `useRecentlyViewed.add` is for B16's PDP to call.

### Phase A4 — Order engine & seed data (done)
- Migration `20261019130000_a4_order_engine.sql`: public RPCs `quote_order` (read-only totals + coupon check), `place_order`, `track_order`; internal `price_order`, `normalize_bd_phone`, `request_ip` (execute revoked from anon/authenticated). Contract, error tokens and limits are in `supabase/README.md`.
- `place_order` re-prices from the DB, locks product/variant rows in id order and decrements stock, applies coupon + zone + free-delivery threshold, enforces honeypot (`p_website`), block list, 3/hour per phone and 10/hour per IP (advisory-locked), and numbers orders `HVX-10001…` from `order_number_seq`. `track_order` needs phone + number and returns no address/phone/name/notes.
- `seed.sql`: 7 categories, 24 watches (3 with variants, 1 sold out, 2 low stock), 52 placeholder Unsplash images, 2 collections, 12 reviews, 3 zones, settings, 13 home sections, 3 hero slides, a promo banner, 8 FAQs, 6 testimonials, 6 pages. Contact details and socials are left empty on purpose.
- Verified: `tests/a4_order_check.sql` passes live and on PGlite (re-runnable, leaves no rows, rewinds the sequence); six planted engine bugs each make it fail. Live anon probes: seeded data readable, tampered price ignored, `price_order` / coupons / orders denied. The first seed run didn't land; the second did.
- For later: B5/B16 swap the Unsplash `w/h` params for srcset; replace placeholder photos (some show other brands' dials) and draft policy/FAQ copy with the client's (C6). B18 maps the error tokens to `strings.js` copy and keeps the honeypot field hidden. C5: `track_order` and `quote_order` have no rate limit (order-number guessing, coupon enumeration); consider a small attempts table. `maintenance_mode` isn't enforced by `place_order` yet (B29/C5).

### Phase A3 — Database schema & RLS (done)
- Supabase project created (Mumbai), `.env` holds URL + publishable key. Migrations in `supabase/migrations/` (schema · RLS · storage) were applied by pasting into the SQL Editor; `supabase/README.md` documents the steps and the access model. No CLI or DB password needed.
- All §9.4 tables + indexes + `updated_at` triggers. `cost_price` lives in admin-only `product_costs`, not `products`. Customers = `admin_customers` view (`security_invoker`, built from orders). Status changes write `order_status_history` via trigger (`changed_by = auth.uid()`). `site_settings` singleton row is created by the migration (A4 seed should `update` it).
- Helpers `is_admin()` / `is_manager()` / `is_owner()` / `admin_role()`. RLS on every table: public reads published rows; staff = orders, customers, blocked phones; manager = all but settings/admin users; owner = all. No INSERT policy on `orders` for anyone, so A4's `place_order` must be `security definer`. Anon may only insert `subscribers` / `contact_messages` (frontend must not request `return=representation`; no read-back).
- Buckets `product-images`, `site-media` (≤ 50 MB, allows mp4/webm), `review-photos`: public by URL, not listable by anon, manager+ write.
- Verified: `supabase/tests/a3_rls_check.sql` passes on the live project (and locally on PGlite, where planted leaks make it fail); anon REST probes get 42501 on orders/costs/coupons/customers and `cost_price` doesn't exist. No UI change.
- For later: new tables in A4+ need explicit `grant`s like A3 (Supabase's default grants differ per project setting). A6: disable public sign-ups in Auth settings (any signup gets `authenticated`; harmless under RLS but noisy). `order_number` format is only checked (`^HVX-[0-9A-Z]{5,}$`); A4 generates it.

### Phase A2 — Core primitives & style guide (done)
- `components/common`: Button (primary gold + sheen / secondary / ghost / link, `loading`), Badge (new / sale / limited / soldOut), Card, Container, SectionHeading (`action` → "View all →") restyled; new IconButton, Input (floating label, `multiline`, `error`/`hint`), Select (native), Drawer (right panel ≥ md, bottom sheet on mobile; `side="left"`), Modal, Skeleton, Price, Rating. Template variant names (`outline`, `ghost`, `success`, `neutral`, `hoverable`) still work.
- Surface-aware colours: CSS vars in `index.css` exposed as Tailwind colours `fg`, `on-fg`, `muted`, `surface`, `raised`, `line`, `control`, `brand`, `focus`, `danger`, `positive`, `warning` (+ `shadow-surface`). New `.section-dark` restores dark vars inside ivory. Drawer/Modal take `tone="dark" | "ivory"` (default dark).
- Drawer/Modal share `DialogShell` (native `<dialog>` + showModal): ESC, backdrop, close button, Tab wrap, scroll lock, focus to `[data-autofocus]` or the panel, focus back to the trigger. Verified in the browser on both tones at 1440px and 375px.
- `lib/format.js`: `formatTaka` (en-IN lakh grouping), `discountPercent` (≥ 10% rule), `normalizePhone` / `formatPhone` / `isValidPhone`, `formatDate`, `formatDeliveryBy`. `lib/strings.js` holds UI copy (functions for interpolation). `lucide-react` installed (icons: `size={20} strokeWidth={1.5}`).
- `/style-guide` is dev-only (route spread behind `import.meta.env.DEV`; not in the production bundle). `.claude/launch.json` gained `horvex-dev-alt` on port 5174 for when another session holds 5173.
- For later: the ৳ glyph isn't in Manrope, so it renders from the system Bengali font (consider a tiny Hind Siliguri subset for U+09F3 in C4). Template `BrandStory` overflows 8px at 375px before its Reveal fires (no `overflow-hidden`), fix when B9 rebuilds it. `/admin` loaded directly logs React Router's "No HydrateFallback" warning (add `HydrateFallback` in A6/B21). The template ProductCard still shows `$` prices until B5 swaps in `<Price>`.

### Phase A1 — Design tokens & fonts (done)
- `tailwind.config.js` rewritten: §3.1 palette, fluid type roles (`text-display/h1/h2/h3/eyebrow/body/small/button/price`, a plugin so each class also sets the font family), `xs` 360 breakpoint, `rounded-control/card/pill`, `shadow-highlight` (dark) / `shadow-soft` (ivory), `bg-grain`, `bg-gold-glow`, `bg-vignette`, tracking `eyebrow/button/wordmark`, `duration-fast/base/slow/reveal`, `ease-out-expo` (default) / `ease-in-out-cubic`.
- Motion values live in `src/lib/motion.js` (`DURATION`, `EASE`); the Tailwind config imports them, so `motion` components should import the same constants.
- Fonts are self-hosted with `@fontsource-variable/manrope`, `@fontsource-variable/cormorant-garamond` (+ italic) and `@fontsource/michroma` in `src/styles/fonts.css`; the Google Fonts link is gone. CSS moved to `src/styles/` (§9.2). Hind Siliguri is not installed (optional, only if Bangla copy is added).
- Base CSS: obsidian + grain body, `.section-ivory`, context vars `--accent-text` / `--focus-ring` (gold on dark, gold-deep on ivory), gold `:focus-visible`, gold `::selection`, `--gutter` (16/24/40 → `px-gutter`) and `--section-y` (64/96/128 → `py-section`).
- Template aliases: `bg`→ivory, `bg-secondary`→parchment, `ink-secondary`→taupe, `border`→light hairline, `accent`→ink, `success`→emerald, `sale`→oxblood; radii tightened to 2/4px. `StoreLayout` uses `section-ivory` (and `AdminLayout` got `text-ink`) so the template stays readable on the dark base. Remove both once B1/B21 rebuild the shells.
- Favicon is now the placeholder monogram (H in a 12-tick bezel). `monogram.svg`, logos, apple-touch-icon and the OG image are still to do (C3 / when the client supplies a logo).

### Phase 0 — Project setup (done)
- Template copied in, package renamed `horvex@0.1.0`; router skeleton with placeholder pages; `/admin/*` lazy-loaded as its own chunk (`src/admin/AdminApp.jsx`).
- Template home sections and `src/data/` are kept as-is until B11 removes what's unused.
- Form libraries deferred to B18 (`@hookform/resolvers@6` peer conflict). Admin-only libraries get installed in the phase that needs them.
- `npm audit`: 8 findings, all in Tailwind 3's build-time toolchain; nothing ships to the browser.
- Build clean; lint shows 0 errors (only the template's existing `icons.jsx` fast-refresh warnings).

## Decisions Log
- Keep template stack (React 19 + Vite 8 + Tailwind 3.4); Supabase is the backend.
- Guest checkout only at launch; COD is the only payment method.
- Dark-luxury theme with ivory breathing sections; champagne gold is the single accent.
- Admin is mounted via a lazy `admin/*` route with its own `<Routes>` (React Router 7's route `lazy` can't supply `children`).
- Page titles use React 19's native `<title>`; no helmet library.
- Phases are session-sized: block A Opus → block B Sonnet → block C Opus (roadmap §14).
- Type roles are single classes (`text-h2` sets family + size + leading + tracking + weight) in the components layer, so `font-*`/`text-<color>` utilities still override them.
- Surface-aware colour is done with CSS vars (`--accent-text`, `--focus-ring`) that `.section-ivory` flips; primitives should use them instead of branching per surface.
- Variable fonts (`@fontsource-variable`) over static weights: one file per subset covers every weight.
- Template `accent` aliases to ink, not gold: gold fails contrast on the ivory template sections. A2 restyles Button to gold on dark.
- AA fixes to the §3.1 palette (A2): `gold-deep` #8A6A35 → #80612D (was 4.45:1 on ivory; now 5.09 ivory / 4.53 parchment); `emerald` #3F7D5A → #356E4E (ivory text on it 5.34:1). Added text variants `oxblood-light` #D2756B and `emerald-light` #5E9C78 (text on dark, ≥ 5.1:1 on graphite) and `amber-deep` #865D1C (text on light). Added `pewter` #6E6F75 / `stone` #857F75 for form-control borders (≥ 3:1, WCAG 1.4.11); `steel` stays for decorative dividers.
- Primary button is gold with obsidian text on every surface (≥ 8.7:1), not ink on ivory, for one consistent CTA.
- Drawer/Modal use a native `<dialog>` (top layer + inert page) plus a Tab-wrap handler, instead of a portal + focus-trap library.
- Context colours use `color-mix()` in the Tailwind colour functions so `/opacity` modifiers work on CSS-var colours.
- IconButton is circular (`rounded-full`), an exception to the "999px only for chips" radius rule, matching the "ring" spec.
- `cost_price` is a separate `product_costs` table (manager+) instead of a column: RLS is row-level, and column grants would break `select=*` for every role.
- Table grants are explicit: anon gets SELECT only on storefront tables and INSERT only on `subscribers` / `contact_messages`; sensitive tables aren't granted to anon at all (fails before RLS). `authenticated` gets CRUD and RLS decides.
- Role helpers are `security definer` with `search_path = ''`; policies call them as `(select public.is_admin())` so they run once per statement.
- Status-like columns are `text` + CHECK, not enums (easier to extend from a migration).
- Migrations are applied through the dashboard SQL Editor (no Supabase CLI/DB password); every migration ships with a self-cleaning test script in `supabase/tests/`.
- Order engine is plain SQL RPCs (`security definer`, `search_path = ''`), not an Edge Function: one transaction covers locking, stock, coupon and insert. Errors are stable snake_case tokens in `message`; the UI owns the wording.
- Totals: `subtotal − discount + delivery`; free delivery applies when `subtotal − discount ≥ free_delivery_threshold` or with a `free_shipping` coupon. Checkout shows `quote_order` numbers, never client-computed ones.
- Products with variants keep stock on the variants (a `variant_id` is required); `products.stock` is kept equal to their sum for listings.
- Categories are styles (automatic-skeleton, chain, leather, couple, accessories); `men` / `women` are gender landing categories that list by `products.gender` (+ unisex), not `category_id`. Rule collections use `rules` like `{"price_max": 2999}`.
- Order numbers are sequential (`HVX-10001`), easy to read out on a phone call; `track_order` still needs the matching phone. Limits: 20 lines, 10 per line, 3 orders/phone/hour, 10/IP/hour (shared carrier IPs).
- `order_rejected` is deliberately the same for blocked phones and the honeypot.
- Data layer: services return snake_case DB rows; components use hooks only; query keys are `[domain, kind, ...params]` from one factory, and writes invalidate a whole domain.
- Wishlist and recently viewed store ids only (fresh product data on load); the cart stores display snapshots clamped to the engine's limits and the stock at add time; checkout trusts only `quote_order`.
- Admin uses its own Supabase client/session (`horvex-admin-auth`); the storefront client never has a session, so RLS admin rights (drafts, hidden rows) never leak into the shop view.
- Admin access = Supabase Auth session + `admin_profiles` row. UI role gates mirror RLS (`hasRole`), RLS stays the real enforcement. Non-staff are signed out at login.
- Activity log is written client-side after a successful admin mutation (best-effort, never fails the save); admin read keys are `[domain, "admin", …]` so domain invalidation covers them and sign-out drops them.
- Admin images are compressed to WebP in the browser before upload, stored under random names (immutable, 1-year cache).
- Persisted stores share `store/persist.js`: versioned `horvex-<name>` keys, reset on a version bump without a migrate, cross-tab sync via the storage event. Overlay UI state is never persisted.
