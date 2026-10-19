# HORVEX — Progress Tracker

Master plan: `roadmap.md` (design system, page specs, data model, phases).

## Current Phase
**Phase 0 — Project setup & audit: COMPLETE**

- Copied the `ecommerce-landing_v22` template into this folder (its old `plan.md`/`roadmap.md` were left out; the HORVEX docs replace them).
- Renamed the package to `horvex@0.1.0`; set the page title, meta description and `theme-color` in `index.html`; rewrote `README.md`.
- Added `.gitignore`, `.env.example` (Supabase URL + anon key placeholders), `vercel.json` (SPA rewrite so deep links work on refresh) and `.claude/launch.json` (dev server on port 5173).
- Installed the core storefront libraries: `react-router`, `@tanstack/react-query`, `zustand`, `@supabase/supabase-js`, `motion`, `lenis`, `embla-carousel-react`, `sonner`.
  - **Deferred to Phase 8:** `react-hook-form`, `zod`, `@hookform/resolvers`. `@hookform/resolvers@6` failed with a peer-dependency conflict (optional `effect@^4` peer). Pin a compatible resolvers version when checkout is built; don't use `--legacy-peer-deps`.
  - **Deferred to Phases 9–12:** admin-only libraries (`@tanstack/react-table`, `recharts`, `@dnd-kit`, `tiptap`, `browser-image-compression`).
- Router skeleton (roadmap §5):
  - `src/App.jsx` → `Providers` (React Query) + `RouterProvider`.
  - `src/app/router.jsx`: storefront routes inside `StoreLayout`; each unbuilt page is a `PagePlaceholder` that names the phase delivering it. Includes a `*` 404 page.
  - `src/components/layout/StoreLayout.jsx`: skip link, announcement bar, navbar, `<main id="main-content">`, footer, `ScrollRestoration` (moved out of the old `App.jsx`).
  - `src/pages/Home.jsx`: the template's 13 landing sections, unchanged, until Phase 4 rebuilds them.
  - `src/admin/AdminApp.jsx`: the `/admin/*` route is lazy-loaded as its own chunk (~2.8 KB now) with nested placeholder routes and a minimal `AdminLayout` nav. No auth yet (Phase 9).
- Template demo data in `src/data/` is **kept** as seed/fallback content, because the home sections still render from it. It gets replaced when Supabase data is wired in (Phases 2 and 4).
- Verification: `npm run build` is clean (admin split into a separate chunk). `npm run lint` shows 0 errors, only the template's pre-existing `only-export-components` warnings in `icons.jsx`. In the browser, `/`, a placeholder route, the 404 and `/admin/orders` all render with no console errors.
- `npm audit`: 8 findings (2 moderate, 6 high), all in Tailwind 3's build-time dependency chain (`braces`, `chokidar`, `micromatch`, `postcss-selector-parser`, `source-map-js`). Dev-tooling DoS issues; nothing ships to the browser. Revisit if we move to Tailwind 4.
- Git initialized on `main`, nothing committed yet.

## Next Phase
**Phase 1 — Brand & design system.** Replace Tailwind tokens with the roadmap §3 palette/type/radius/motion, self-host Cormorant Garamond + Manrope via `@fontsource`, add grain texture, restyle `common/` components, add Input/Drawer/Modal/Skeleton/Price and the ৳ formatter, and build a temporary style-guide route.

## Phase Checklist
- [x] 0 Project setup & audit
- [ ] 1 Brand & design system
- [ ] 2 Backend foundation (Supabase)
- [ ] 3 Layout shell
- [ ] 4 Home landing
- [ ] 5 Shop & category
- [ ] 6 Product detail
- [ ] 7 Wishlist & cart
- [ ] 8 COD checkout & orders
- [ ] 9 Admin foundation
- [ ] 10 Admin: catalog
- [ ] 11 Admin: orders & customers
- [ ] 12 Admin: CMS & settings
- [ ] 13 Motion polish
- [ ] 14 SEO, analytics, performance, a11y
- [ ] 15 QA, launch & handover

## Decisions Log
- Keep template stack (React 19 + Vite 8 + Tailwind 3.4); add Supabase as backend.
- Guest checkout only at launch (no login wall); COD is the only payment method.
- Dark-luxury theme with ivory breathing sections; champagne gold is the single accent.
- Admin is loaded via a lazy `admin/*` route with its own `<Routes>`. (React Router 7's route `lazy` can't supply `children`, so this keeps the admin in one separate chunk.)
- Page titles use React 19's native `<title>` in components; no helmet library.
