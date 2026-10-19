# HORVEX — Progress Tracker

Phase specs: `roadmap.md` §14 · Session starter: `PHASE_PROMPT.md` · Project rules: `CLAUDE.md`

## Status
Statuses: `todo` · `in progress` · `blocked (👤 you)` · `done`

| ID | Phase | Model | Status |
|---|---|---|---|
| 0 | Project setup | — | done |
| A1 | Design tokens & fonts | Opus | todo |
| A2 | Core primitives & style guide | Opus | todo |
| A3 | Database schema & RLS | Opus | todo |
| A4 | Order engine & seed data | Opus | todo |
| A5 | Data layer & client state | Opus | todo |
| A6 | Admin auth & admin patterns | Opus | todo |
| B1 | Header (desktop) + announcement | Sonnet | todo |
| B2 | Mega menu & search | Sonnet | todo |
| B3 | Mobile nav & footer | Sonnet | todo |
| B4 | Cart drawer & toasts | Sonnet | todo |
| B5 | Product card & grid | Sonnet | todo |
| B6 | Home: hero & trust | Sonnet | todo |
| B7 | Home: categories & featured | Sonnet | todo |
| B8 | Home: anatomy & him/her | Sonnet | todo |
| B9 | Home: brand film & promo | Sonnet | todo |
| B10 | Home: trust & social | Sonnet | todo |
| B11 | Home: finish & cleanup | Sonnet | todo |
| B12 | Shop listing | Sonnet | todo |
| B13 | Filters | Sonnet | todo |
| B14 | PDP gallery | Sonnet | todo |
| B15 | PDP buy box | Sonnet | todo |
| B16 | PDP details | Sonnet | todo |
| B17 | Wishlist & cart pages | Sonnet | todo |
| B18 | Checkout form | Sonnet | todo |
| B19 | Checkout submit & tracking | Sonnet | todo |
| B20 | Info pages | Sonnet | todo |
| B21 | Admin shell & dashboard | Sonnet | todo |
| B22 | Admin products I | Sonnet | todo |
| B23 | Admin products II | Sonnet | todo |
| B24 | Admin categories & collections | Sonnet | todo |
| B25 | Admin orders I | Sonnet | todo |
| B26 | Admin orders II | Sonnet | todo |
| B27 | Admin homepage builder | Sonnet | todo |
| B28 | Admin content | Sonnet | todo |
| B29 | Admin settings | Sonnet | todo |
| C1 | Signature motion I | Opus | todo |
| C2 | Signature motion II | Opus | todo |
| C3 | SEO & analytics | Opus | todo |
| C4 | Performance & a11y audit | Opus | todo |
| C5 | Security & code review | Opus | todo |
| C6 | QA, launch & handover | Opus | todo |

## Next Up
**A1 — Design tokens & fonts (Opus).**

## Session Notes
Newest first. Keep each entry to 3–6 lines: what was done, anything deferred, anything the next phase must know. For an unfinished phase, list what's done and what's left.

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
