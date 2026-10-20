# WRISTORY

Premium watch e-commerce storefront with Cash on Delivery checkout and an admin panel.

- Master plan (design system, page specs, data model, phases): [`roadmap.md`](roadmap.md)
- Progress tracker: [`plan.md`](plan.md)

## Stack

React 19 · Vite 8 · Tailwind CSS 3.4 · React Router 7 · Supabase (backend, from Phase 2)

## Getting started

Requires Node 20.19+ or 22.12+.

```bash
npm install
cp .env.example .env   # fill in Supabase keys (needed from Phase 2)
npm run dev            # http://localhost:5173
```

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Project layout

```
src/
  app/          router and app-wide providers
  components/   common, layout and home UI (from the base template)
  pages/        storefront pages
  admin/        admin panel (lazy-loaded, separate bundle)
  data/         seed/fallback content until Supabase is wired up
  hooks/        shared hooks
```

## Deployment

Deployed on Vercel. `vercel.json` rewrites every path to `index.html` so client-side routes work on refresh.
