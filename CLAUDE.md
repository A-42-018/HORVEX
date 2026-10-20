# WRISTORY — project rules for Claude

Premium watch store for Bangladesh: React 19 + Vite 8 + Tailwind 3.4 + React Router 7, Supabase backend, Cash on Delivery checkout, admin panel at `/admin`.

## Key files
- `plan.md`: phase status, session notes, decisions. **Read first every session.**
- `roadmap.md`: full spec (667 lines). §14 lists the phases. Grep the phase's row and read only the line ranges it references, never the whole file.
- `docs/history.md`: archived session notes + full decisions log. Block B doesn't need it; block C reads it first.
- `src/app/router.jsx`: storefront routes · `src/admin/AdminApp.jsx`: admin routes (lazy chunk).

## Commands
- `npm run dev` (port 5173; the browser preview config is in `.claude/launch.json`)
- `npm run build` · `npm run lint`

## How every phase works
1. Build **only** the current phase's scope. If you notice other needed work, note it in `plan.md`; don't do it.
2. Inspect the existing code before writing. Reuse components, tokens, hooks and services; don't rewrite working code.
3. Verify before finishing: `npm run build` and `npm run lint` show no new errors, and the affected pages are checked in the browser at desktop and 375px with no console errors.
4. Update `plan.md`: status, a short session note, and any decisions.
5. Commit with the message `Phase <ID>: <name>`. Never push and never commit `.env`.
6. Running low on usage? Stop at a working state, set status to `in progress`, write in the notes what's done and what's left, and commit as `WIP Phase <ID>`.

## Data & state conventions
- **Components never call Supabase directly.** Flow: `services/*.js` (queries, built on `query()` / `rpc()` from `services/supabase.js`, which throw `ServiceError` with a `code`) → hooks (`hooks/useCatalog.js`, `useContent.js`, `useOrders.js`) → components. New reads get a service function and a hook.
- **Query keys only come from `services/queryKeys.js`**: `[domain, kind, ...params]`. Writes invalidate a whole domain (`queryKeys.products.all`). Content/settings/categories use a 5-minute `staleTime`, products the 60 s default.
- Services return DB rows in snake_case (`compare_at_price`), with `images` / `variants` already sorted. Listings return `{ items, total }`; single lookups return `null` when not found.
- Order-engine failures surface as `error.code` = the engine token (`out_of_stock`, `invalid_coupon`, …). Map tokens to `strings.js` copy in the UI. Checkout totals come only from `useOrderQuote` / `usePlaceOrder`.
- Client state is Zustand in `store/`: `useCart`, `useWishlist`, `useRecentlyViewed` (persisted as `wristory-<name>`, synced across tabs) and `useUI` (overlays, not persisted). Subscribe with selectors (`useCart(selectCartCount)`), not the whole store. Wishlist and recently viewed hold ids only; load products with `useProductsByIds`. Cart lines are display snapshots capped at the engine limits (20 lines, 10 per line, stock).
- **Admin data** goes through `services/adminClient.js` (its own session, storage key `wristory-admin-auth`); never import it, `auth.js`, `admin.js` or `storage.js` from storefront code, and never give the storefront client a session. Admin reads use keys `[domain, "admin", …]`. Admin writes use `useAdminMutation` / `useAdminCrud` (`admin/hooks/useAdminMutation.js`): invalidate domains + an activity_log entry. Uploads use `useImageUpload`. Gate pages with `RequireRole` (`admin/auth/roles.js`); RLS is the real enforcement.
- **Customer accounts (C6b, optional; guest checkout stays the default)**: `services/customerAuth.js` is a third client, separate from both others: `@supabase/auth-js` `AuthClient` (storage key `wristory-customer-auth`, implicit flow, reads email links) plus a PostgREST client that sends the customer's token. Only `services/account.js` and `hooks/useAccount.js` import it, and only the `/account/*` pages (`pages/account`, one lazy chunk) import those, so auth-js never loads in the storefront's main bundle (header and menu just link to `/account`). Catalog reads, checkout and track order keep the anonymous storefront client; never route them through the customer client or put a session on `services/supabase.js`. Customers are `authenticated` users without an `admin_profiles` row, so RLS treats them like anon; they may only touch `customer_profiles` (own row) and `my_orders()` (orders whose email matches their confirmed account email). Keys `["account", …]` are dropped on customer sign-out. Auth error codes map to `strings.account.authErrors`.
- Copy: store text in `lib/strings.js`; admin code imports `strings` from `admin/strings.js` (store copy + `strings.admin`), so admin copy stays out of the store bundle.
- Bundle (C4): new storefront pages are lazy routes via `app/routeChunks.js`; the storefront Supabase client is PostgREST-only (`services/supabase.js`), never import `@supabase/supabase-js` outside `adminClient.js`. The one other auth import is `@supabase/auth-js` in `services/customerAuth.js` (see Customer accounts).
- Analytics: call `track(EVENTS.x, params)` from `lib/analytics.js` (GA4 event names). The cart and wishlist stores already track their own events.

## Code rules
- Mobile-first and responsive (360px → 1920px). Tap targets ≥ 44px.
- Use design tokens from `tailwind.config.js` only; no hardcoded hex colors or one-off font sizes.
- No fake functionality: if something isn't wired yet, show an honest placeholder.
- Accessibility: semantic HTML, labels on icon buttons, visible focus rings, keyboard-operable drawers/modals (focus trap + ESC), AA contrast.
- Animate only `transform`/`opacity`, and respect `prefers-reduced-motion` (a global override exists in `index.css`).
- Prices: always format with the shared ৳ formatter. Totals are trusted only from the server (`place_order`).
- Never put the Supabase service_role key in frontend code or `VITE_*` variables.
- Install only the dependencies the current phase needs. Never use `--legacy-peer-deps`; pin a compatible version instead.
- Match the surrounding code style: small focused components, short comments only where intent isn't obvious.
