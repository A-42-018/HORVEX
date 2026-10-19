# HORVEX — Progress Tracker

Phase specs: `roadmap.md` §14 · Session starter: `PHASE_PROMPT.md` · Project rules: `CLAUDE.md`

## Status
Statuses: `todo` · `in progress` · `blocked (👤 you)` · `done`

| ID | Phase | Model | Status |
|---|---|---|---|
| 0 | Project setup | — | done |
| A1 | Design tokens & fonts | Opus | done |
| A2 | Core primitives & style guide | Opus | done |
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
**A3 — Database schema & RLS (Opus).** Starts with a 👤 You step: create the Supabase project and put the URL + anon key in `.env`.

## Session Notes
Newest first. Keep each entry to 3–6 lines: what was done, anything deferred, anything the next phase must know. For an unfinished phase, list what's done and what's left.

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
