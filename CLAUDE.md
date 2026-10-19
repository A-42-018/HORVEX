# HORVEX — project rules for Claude

Premium watch store for Bangladesh: React 19 + Vite 8 + Tailwind 3.4 + React Router 7, Supabase backend, Cash on Delivery checkout, admin panel at `/admin`.

## Key files
- `plan.md`: phase status, session notes, decisions. **Read first every session.**
- `roadmap.md`: full spec. §14 lists the phases. Read only the sections the current phase references, not the whole file.
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
