# HORVEX — Progress Tracker

Phase specs: `roadmap.md` §14 · Session starter: `PHASE_PROMPT.md` · Project rules: `CLAUDE.md` · Archive: `docs/history.md` (old notes + decisions; don't read it for block B)

## Next Up
**B1a — Announcement bar (Sonnet).**

## Status
Statuses: `todo` · `in progress` · `blocked (👤 you)` · `done`

**Done:** 0 Project setup · A1 Design tokens & fonts · A2 Core primitives & style guide · A3 Database schema & RLS · A4 Order engine & seed data · A5 Data layer & client state · A6 Admin auth & admin patterns

| ID | Phase | Model | Status |
|---|---|---|---|
| B1a | Announcement bar | Sonnet | todo |
| B1b | Desktop header | Sonnet | todo |
| B2a | Mega menu | Sonnet | todo |
| B2b | Search overlay | Sonnet | todo |
| B2c | Search extras | Sonnet | todo |
| B3a | Mobile header & menu | Sonnet | todo |
| B3b | Bottom tab bar & FAB | Sonnet | todo |
| B3c | Footer | Sonnet | todo |
| B4a | Cart drawer | Sonnet | todo |
| B4b | Toasts & add-to-bag | Sonnet | todo |
| B5a | Product card | Sonnet | todo |
| B5b | Product grid | Sonnet | todo |
| B6a | Hero slider | Sonnet | todo |
| B6b | Trust marquee | Sonnet | todo |
| B7a | Category tiles | Sonnet | todo |
| B7b | Featured tabs | Sonnet | todo |
| B8a | Anatomy (static) | Sonnet | todo |
| B8b | Him / Her | Sonnet | todo |
| B9a | Brand film | Sonnet | todo |
| B9b | Promo banners | Sonnet | todo |
| B10a | Reviews | Sonnet | todo |
| B10b | How-to-Order & Instagram | Sonnet | todo |
| B11a | Join & FAQ | Sonnet | todo |
| B11b | Section wiring | Sonnet | todo |
| B11c | Template cleanup | Sonnet | todo |
| B12a | Listing pages | Sonnet | todo |
| B12b | Sort & URL sync | Sonnet | todo |
| B13a | Filters (desktop) | Sonnet | todo |
| B13b | Filters (mobile) | Sonnet | todo |
| B14a | Gallery (desktop) | Sonnet | todo |
| B14b | Gallery (mobile) | Sonnet | todo |
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

_No block B sessions yet._

## Decisions
New decisions from block B go here (one line each). Earlier decisions are in `docs/history.md`; the ones that matter day to day are already in `CLAUDE.md`.
