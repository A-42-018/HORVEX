# HORVEX — Progress Tracker

Phase specs: `roadmap.md` §14 · Session starter: `PHASE_PROMPT.md` · Project rules: `CLAUDE.md` · Archive: `docs/history.md` (old notes + decisions; don't read it for block B)

## Next Up
**C1 — Signature motion I (Opus). Read `docs/history.md` first (block C rule). First: `npm ci && npm run build && npm run lint` (build + lint passed at the end of B29c). Block B is complete but nothing from B26b–B29c has been browser- or DB-checked. Pending 👤/browser: apply migrations `20261020100000_b3c_courier_partners.sql`, `20261020110000_b21c_orders_realtime.sql`, `20261020120000_b29b_site_settings.sql` (then `supabase/tests/b29b_settings_check.sql`) and `20261020130000_b29c_users_activity.sql` (then `supabase/tests/b29c_users_check.sql`; required for Users and Activity), then full browser checks for B1a–B29c (B23a/B23b first: first live uploads; B25a–c first live `orders` read/write; B26b `admin_customers` + `blocked_phones`; B27/B28/B29a/B29b first live content, coupon, zone and settings writes; B29c first call of the six user/activity functions).**

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
- **B29c (done, build + lint OK (0 errors, same warnings), node logic asserts pass, browser / DB NOT run):** **Users** (`/admin/users`, owner only, `pages/Users.jsx`, replaces the placeholder; `PAGES` in `AdminApp` is now empty): list (name, email, last sign-in, role select, Remove with confirm), **Give access** modal (email + name + role). A browser can't create sign-ins (needs service role), so the owner first adds the user in Supabase (Authentication > Users) and then grants a role here by email. **Activity** (`/admin/activity`, manager+, new nav item): newest first, filter by area (`?area=`), Show more (50 at a time, cap 500), changed keys with expandable JSON diff.
  **Migration `20261020130000_b29c_users_activity.sql`:** security-definer `admin_users()`, `add_admin_user(email, name, role)`, `set_admin_role`, `remove_admin_user` (owner only; can't change or remove yourself, so an owner always remains) and `admin_activity_log(entity, limit)` / `admin_activity_entities()` (manager+, return the actor's name since managers can't read `admin_profiles`). Test: `supabase/tests/b29c_users_check.sql` (anon and non-admin refused). User changes are logged as entity `admin_users`.
  **Not done:** email invite / password reset (needs an Edge Function with the service role: C5/C6 or phase 2), activity date / actor filters and CSV export, log retention, a way to see which entries are from before the log existed.
  **Verification gap:** apply the migration, then as owner: add a user by email (unknown email, duplicate and bad role are refused), change a role, the own row is locked, remove asks first; the new staff user can open only Orders and Customers and no Users / Activity; manager sees Activity but not Users; entries appear in Activity after edits elsewhere. Check desktop + 375px, no console errors.
- **B29b (done, JSX syntax checked with typescript, node logic + string-key asserts pass, `npm ci` / build / lint / browser / DB NOT run: no network, `npm ci` died):** **Settings** (`/admin/settings`, **owner only**, `admin/pages/Settings.jsx`, replaces the placeholder; removed from `AdminApp` PAGES). One form, one Save (sends only changed columns, logged as `activity_log` `update` on `site_settings` with column names, not values): Store status (maintenance switch, confirm dialog before closing), Brand (name, 2 logos, favicon, share image via `MediaImageField`, folder `brand/`), Contact (phone, WhatsApp, email, address, footer text; phones stored as `+8801…`), Social links (instagram / facebook / tiktok / youtube, https only; other jsonb keys kept), Couriers (one per line, max 8), SEO defaults (title 70, description 170), Tracking IDs (GA4 `G-…`, Meta Pixel digits). Pure rules in `components/settings/settingsForm.js` (`validateForm`, `toPayload`, `changedColumns`, `parseCouriers`, `parseThreshold`; node asserts pass), service `services/adminSettings.js`, hooks `hooks/useSettingsAdmin.js`, keys `settings.adminRow` / `adminThreshold`, strings `strings.admin.settings.*`.
  **Migration `20261020120000_b29b_site_settings.sql`:** (1) `place_order` re-created (A4 body + one check) and refuses with `maintenance` while `maintenance_mode` is on; (2) `set_announcements(jsonb)` and `set_free_delivery_threshold(integer)`, `security definer`, manager+ only, which settle the open question from B28a: **managers now edit the announcement bar** (Content panel no longer owner-only; service uses the RPC) and the **free-delivery amount** (new card at the top of `/admin/delivery`, `ThresholdCard.jsx`, blank = no free delivery). `site_settings` itself stays owner-only. Test script `supabase/tests/b29b_settings_check.sql`; `supabase/README.md` lists the new token and functions.
  **Storefront:** `StoreLayout` shows `MaintenanceScreen` (brand, notice, call / WhatsApp links if set) instead of the whole store while `maintenance_mode` is true (a settings load error keeps the store open; `/admin` is unaffected); `favicon_url` replaces the `<link rel="icon">` href when set; checkout maps the `maintenance` token to copy.
  **Not done:** logo images are stored but the header / footer / invoice still use the wordmark; `seo_title` / `seo_desc` / `og_image_url` / GA4 / Pixel IDs are saved but nothing reads them yet (per-page meta, OG tags and analytics loading are C3); email / Telegram order notifications; settings revision history; a "preview store" for admins while closed (open the store in a private window to see the notice; admins can still use `/admin`).
  **Verification gap:** **First thing next session: `npm ci && npm run build && npm run lint`.** Apply the migration, then as owner, manager and staff at desktop + 375px: staff and manager can't open `/admin/settings` (owner can); every field loads from the row; save one field, reload, it persists and only that column changed; bad phone / email / link / GA4 / Pixel / over-long fields show errors and focus the first; phones come back as `+8801…` after save; clearing a social removes it from the footer; couriers show in the footer; upload a favicon and the tab icon changes on the store (hard refresh, 5 min cache); maintenance: switch on shows the confirm, "Keep it open" reverts, confirming closes the store (private window shows the notice, `/admin` still works), an order attempt returns the closed copy, switch off reopens; Undo changes; offline shows the error; sticky save bar clears the bottom bar at 375px, no horizontal overflow, no console errors; `activity_log` row appears (owner view). Manager: Content > Announcement bar is editable and saves; Delivery shows the free-delivery card, save 2999, cart / checkout bar follows (hard refresh), clear it and delivery is always charged; staff can't open Delivery.
- **B29a (done, JSX syntax checked with typescript, node logic asserts pass, `npm ci` / build / lint / browser / DB NOT run: no network):** **Coupons** (`/admin/coupons`) and **Delivery zones** (`/admin/delivery`), both `manager+`, replacing the two placeholders (removed from `AdminApp` PAGES). Coupons: list newest first with state badge (Live / Scheduled / Expired / Used up / Off), value text, min order, `used of max`, dates, On switch (optimistic), edit modal (`CouponModal` + `couponForm.js`: code auto-upper-cased, type percent / fixed / free delivery, value, min order, total uses, start / end, On), delete with inline confirm. Zones: ordered list (arrows), charge, ETA, order count, On switch, edit modal (`ZoneModal` + `zoneForm.js`), delete with confirm. Services `adminCoupons.js`, `adminDelivery.js`; hooks `useCouponAdmin.js`, `useZoneAdmin.js`; keys `coupons.*`, `settings.adminZones`; strings `strings.admin.coupons.*` / `delivery.*`. Writes logged as `activity_log` on `coupons` and `delivery_zones`; coupon writes invalidate `coupons`, zone writes invalidate `settings` (checkout selector + quote).
  **Rules used:** code 3–32 of A–Z 0–9 `_` `-`, unique; percent 1–100, fixed 1–1,000,000, free delivery stores 0; total uses ≥ times already used; a new or changed end date must be in the future; code can't change once `used > 0`. Zones: name unique (case-insensitive), charge 0–10,000 whole taka (0 = free), the last active zone can't be turned off or deleted, a zone with orders can't be deleted (turn it off; its orders would lose their zone link), a name containing "outside" makes checkout ask for a district (`isOutsideDhaka`, noted in the modal). New zones go last. No DB change: `price_order` already reads coupons, zones and the threshold live.
  **Not done:** the free-delivery threshold field (lives in `site_settings`, owner-only: B29b), coupon usage list per order, bulk actions, per-zone district flag (still name-based), coupon search / paging (the list shows all).
  **Verification gap:** `couponForm.js` / `zoneForm.js` asserts pass in node and all touched files parse. **First thing next session: `npm ci && npm run build && npm run lint`.** Then as manager and staff at desktop + 375px: staff can't open either page; create a coupon of each type and use it at checkout (totals follow the server); duplicate code refused; a used coupon's code is locked; Off stops it at checkout; scheduled and expired badges are right; delete asks first; zones: add one and it appears in checkout in the chosen order, reorder persists, the last active zone can't be turned off or deleted, a zone with orders has no delete button, an "Outside …" zone asks for a district; offline shows the error; no horizontal overflow at 375px; no console errors; `activity_log` rows appear (owner view).
- **B28c (done, JSX syntax checked with typescript, `npm ci` / build / lint / browser / DB NOT run: no network):** **Reviews** page `/admin/reviews` (`manager+`, `admin/pages/Reviews.jsx`, replaces the placeholder; removed from `AdminApp` PAGES). Status tabs in the URL (`?status=approved|rejected|all`, default Pending) with counts; cards show photo, name, stars, status badge, product (or "Whole store"), date, text; buttons: pending → **Approve / Reject**, approved → **Hide**, hidden → **Approve**, plus **Delete** (inline confirm; removes the uploaded photo). **Add a review** modal (`ReviewModal.jsx`: product or whole store, name 80, rating 1–5, text 2000 required, optional photo to `site-media/reviews/`, "Approve now" checkbox, default on). Service `services/adminReviews.js`, hooks `hooks/useReviewAdmin.js`, rules `components/reviews/reviewRules.js`, keys `queryKeys.reviews.*`, strings `strings.admin.reviews.*`. Writes logged as `activity_log` `update` / `create` / `delete` on `reviews`; every write invalidates `reviews`, `products` and `content` so the PDP and home carousel refresh.\n  **Rules used:** "Hide" and "Reject" both set `status = rejected` (RLS shows approved rows only). Show more 20 at a time. No edit of an existing review's text.\n  **Not done:** editing a review, product filter / search, bulk approve, a pending-count badge in the sidebar, customer-submitted reviews on the store (no form exists yet).\n  **Verification gap:** as manager and staff at desktop + 375px: staff can't open the page; tabs keep `?status=` on reload and counts match; Approve a pending review and it shows on the PDP Reviews tab and home carousel (hard refresh, 5 min cache); Hide removes it; Delete asks first and removes the photo; Add a review with and without product / photo / Approve now; empty name / rating / text refused; offline shows the error; no horizontal overflow at 375px; no console errors; `activity_log` rows appear (owner view).
- **B28b (done, JSX syntax + node logic checked, `npm ci` / build / lint / browser / DB NOT run: no network this session):** **Pages** tab in `/admin/content` (`?tab=pages`, manager+): lists every `pages` row (About + 5 policies; unpublished ones too) with store path, last updated, Unpublished badge, **View** (new tab) and **Edit**. `PageModal.jsx`: title (80), text (20,000), optional search description (160), Publish checkbox, **Write / Preview** toggle (preview uses the storefront's own `PageBody`, so it matches the store). Service `listPageRows` in `services/adminContent.js`, hooks `usePageRows` / `usePageUpdate` in `hooks/useContentAdmin.js`, key `content.adminPages`, rules `components/content/pageForm.js` (`validatePage`, `pageToPayload`, `pagePath`), panel `PagesPanel.jsx`, strings `strings.admin.content.pages.*`. Update-only (diff of changed columns, logged as `activity_log` `update` on `pages`); invalidates `content`.
  **Rules used:** a published page needs text; CRLF normalised to LF and text trimmed on save; no create / delete / reorder because the store routes are fixed (`/about`, `/policy/:slug`). The store renders plain text (blank line = paragraph), so the editor is plain text too.
  **Not done:** **tiptap rich text** (roadmap names it; it needs `npm install` and there was no network, and the store's `PageBody` renders plain text only, so rich text also needs a sanitised HTML renderer on the store: plan it as its own sub-phase or in C3/C5 if the client wants bold / headings / links), page slug editing, new pages, revision history.
  **Verification gap:** `pageForm.js` asserts pass in node and all touched files parse. **First thing next session: `npm ci && npm run build && npm run lint`.** Then as manager, owner and staff at desktop + 375px: staff can't open Content; Pages tab keeps `?tab=pages` on reload; six pages listed; Edit opens with the current text; Preview matches the store; empty title / empty text on a published page / over-long fields are refused; save with no change just closes; a saved edit shows on `/policy/<slug>` and `/about` (hard refresh, 5 min cache); unticking Publish makes the store show "not found"; offline shows the error; no horizontal overflow at 375px; no console errors; `activity_log` row appears (owner view).
## Decisions
New decisions from block B go here (one line each). Earlier decisions are in `docs/history.md`; the ones that matter day to day are already in `CLAUDE.md`.
- `men`/`women` category slugs always resolve to a gender filter (`categoryScope`), on listings and in collection rules.
- Rule collections narrow user filters: price ranges intersect; gender/category/featured/bestseller/badge rules override the URL.
- Checkout district: only the zone named "Outside Dhaka" (`isOutsideDhaka`) asks for a district; every other zone sends "Dhaka". Revisit if admin zones (B29a) need a per-zone flag.
- `site_settings` stays owner-only in RLS. Managers write only the announcement list and the free-delivery amount, through the `set_announcements` / `set_free_delivery_threshold` security-definer functions (B29b). Maintenance mode is enforced in `place_order` (`maintenance` token) and by `StoreLayout` on the storefront.
- Delivery zones with orders are switched off, never deleted (the FK nulls `orders.zone_id`); the last active zone always stays on. Revisit the name-based district rule (`isOutsideDhaka`) if zones need a flag.
