# HORVEX — Premium Watch E-Commerce: Master Plan & Roadmap

> Brand: **HORVEX** · Product: premium wristwatches (men, women, couple sets, accessories)
> Market: Bangladesh (৳ BDT, Cash on Delivery first) · Devices: mobile-first, desktop-premium
> Starting point: `ecommerce-landing_v22` template (React 19 + Vite 8 + Tailwind 3)
> References: pronoun.pro (light, minimal luxury) · zero7.com.bd (dark, sale-driven)

---

## 0. How To Use This Document

- This is the **single source of truth** for design, features, data and build order.
- Build **one phase at a time** (Section 14). Don't start a phase until the previous one meets its acceptance criteria.
- Progress is tracked in `plan.md` (same workflow the template used).
- Template dev rules still apply: reuse before rewriting, no fake functionality, no console errors, responsive from day one, subtle purposeful animation, accessibility built in.

---

## 1. Reference Analysis — What To Take, What To Fix

### 1.1 pronoun.pro (light / minimal)

| Keep (good ideas) | Fix (weak points) |
|---|---|
| Strong brand moment in hero ("LUXURY WATCHES" tracked serif under logo) | Hero is only a logo on a torn-paper texture: no product, no CTA, nothing to click |
| Five category tiles with lifestyle photos (Watch, Bracelet, Wallet, Box, Strap) | 8 small top-level nav items; hard to scan, worse on mobile |
| Clean 4-column product grid, discount badge, strike-through price | Red "HOT" circles plus "-39%" on almost every card cause badge fatigue and look cheap |
| Dark "brand film" block with Shop Now / View More | "Featured Categories" heading sits above a video, not above categories (broken structure) |
| "With You" newsletter band over a lifestyle photo | Login/Register up front adds friction; BD COD buyers prefer guest checkout |
| Footer shows courier partner and payment methods (builds trust) | Prices shown as `999.00৳`, which is cluttered. No reviews or social proof anywhere |

### 1.2 zero7.com.bd (dark / sale-driven)

| Keep (good ideas) | Fix (weak points) |
|---|---|
| Announcement bar with offers ("Spend ৳1999 & get free delivery") | "MEGA SALE" ribbon hero reads as a discount shop, not a premium one |
| Centered logo with split nav (left: categories, right: account/cart) | Same products repeated in 3 grids; the page is long but has little new content |
| Hero slider with numbered progress (01 — 02 — 03) | Four promo banners in four different visual styles; no brand consistency |
| Gents / Ladies / Kids category tiles with "Shop Now" pill | Small grey text on black fails contrast |
| **"Order → Confirm → Receive"** strip, very good for COD trust | Product photos have inconsistent backgrounds and lighting |
| Black-glove product photography gives a strong signature look | Quick actions (compare/search/heart) only appear on hover, so mobile users never see them |

### 1.3 The HORVEX direction (combining both)

**"Dark Luxury, Light Breathing."** The base is a cinematic dark theme (zero7's mood, refined). Ivory/parchment sections are placed between dark ones so the page breathes (pronoun's whitespace). One accent, champagne gold, is used sparingly. Sales get their own slot and never take over the brand. Every section either **builds desire**, **builds trust**, or **drives an action**.

---

## 2. Brand Identity

### 2.1 Positioning
- **Tagline (pick one with client):** "Time, Refined." · "Wear Your Moment." · "Precision, Worn Well."
- **Voice:** confident, short, quietly luxurious. No exclamation marks or emoji in UI copy.
- **Promise strip:** Cash on Delivery · Check Before You Pay · 7-Day Replacement · Delivery All Over Bangladesh.

### 2.2 Logo (placeholder until client supplies one)
- Wordmark `HORVEX`, uppercase, wide letter-spacing (0.32em).
- Placeholder font: **Michroma** (wide, bezel-numeral feel). Final logo should be vector (SVG) and custom.
- Monogram: an **"H" inside a thin bezel ring** with 12 tick marks, used for favicon, preloader and app icon.
- Required files: `logo-light.svg`, `logo-dark.svg`, `monogram.svg`, `favicon.ico/svg`, `apple-touch-icon 180×180`, `og-image 1200×630`.

---

## 3. Design System

### 3.1 Color Palette — "Midnight & Champagne"

| Token | Hex | Use |
|---|---|---|
| `obsidian` | `#0B0B0C` | Main dark background |
| `carbon` | `#141416` | Cards and surfaces on dark |
| `graphite` | `#1E1F22` | Raised surfaces, inputs, drawers |
| `steel` | `#2A2B2F` | Borders and dividers on dark |
| `smoke` | `#9A9AA0` | Secondary text on dark (passes AA on obsidian) |
| `ivory` | `#F5F1EA` | Light section background; main text on dark |
| `parchment` | `#EAE4D9` | Secondary light background and cards on ivory |
| `ink` | `#151412` | Main text on light |
| `taupe` | `#6B665E` | Secondary text on light |
| `gold` | `#C9A96E` | **Accent**: primary CTA, active states, eyebrows, prices on dark |
| `gold-light` | `#D8BC86` | Gold hover |
| `gold-deep` | `#8A6A35` | Gold text **on light backgrounds** (plain gold fails contrast on ivory) |
| `oxblood` | `#9E3B34` | Sale and discount (a muted luxury red, not bright red) |
| `emerald` | `#3F7D5A` | Success, in stock, order confirmed |
| `amber` | `#C08A2E` | Warning, low stock |

**Rules**
- Gold covers **5% or less of any screen**: CTAs, small labels, thin lines, and nothing larger.
- Never put `gold` text on `ivory`; use `gold-deep` there.
- No gradients except (a) a soft radial gold glow behind hero/product images (`rgba(201,169,110,0.12)`) and (b) a dark vignette over photos for text legibility.
- Section rhythm: **Dark → Dark → Ivory → Dark → Ivory → Dark footer** (exact order in Section 5).

### 3.2 Typography (all free; self-hosted with `@fontsource` for speed)

| Role | Font | Weights | Notes |
|---|---|---|---|
| Display / headlines | **Cormorant Garamond** | 500, 600, 500 italic | High-contrast luxury serif; italic for accent words ("Time, *Refined.*") |
| UI / body / prices | **Manrope** | 400, 500, 600, 700 | Modern geometric sans; use `tabular-nums` for prices |
| Logo placeholder only | **Michroma** | 400 | Wordmark only, never body |
| Bangla (optional bilingual) | **Hind Siliguri** | 400, 500, 600 | Pairs well with Manrope |

*Paid upgrade if the client wants extra polish:* **Canela** or **Ogg** (display) with **Neue Montreal** (UI).

**Type scale (fluid with `clamp()`)**

| Token | Size | Font / weight | Line-height | Tracking |
|---|---|---|---|---|
| `display` | `clamp(2.75rem, 5vw + 1rem, 6.5rem)` | Cormorant 500 | 0.95 | -0.01em |
| `h1` | `clamp(2.25rem, 3.5vw + 1rem, 4rem)` | Cormorant 500 | 1.05 | -0.01em |
| `h2` | `clamp(1.875rem, 2.5vw + 1rem, 3rem)` | Cormorant 500 | 1.1 | 0 |
| `h3` | `1.375rem` | Manrope 600 | 1.3 | -0.01em |
| `eyebrow` | `0.75rem` | Manrope 600 UPPERCASE | 1 | **0.28em**, gold |
| `body` | `1rem` | Manrope 400 | 1.7 | 0 |
| `small` | `0.875rem` | Manrope 400 | 1.55 | 0 |
| `button` | `0.8125rem` | Manrope 600 UPPERCASE | 1 | 0.14em |
| `price` | `1.125rem` | Manrope 600 tabular | 1 | 0 |

### 3.3 Spacing, Grid, Radius, Elevation
- **Container:** max 1320px; side padding 16px (mobile) / 24px (tablet) / 40px (desktop).
- **Section padding:** 64px mobile → 96px tablet → 128px desktop.
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128.
- **Breakpoints:** 360, 640, 768, 1024, 1280, 1536.
- **Product grid:** 2 columns on mobile (12px gap), 3 on tablet, 4 on desktop (24px gap).
- **Radius:** luxury favors tight corners. `2px` buttons/inputs, `4px` cards/images, `999px` only for chips and counters.
- **Elevation:** on dark, use **borders plus faint inner highlight** (`inset 0 1px 0 rgba(255,255,255,0.04)`) instead of shadows. On ivory, use a soft shadow `0 20px 40px -24px rgba(21,20,18,0.25)`.
- **Texture:** a 3% film-grain noise overlay (tiny tiled PNG/SVG) on dark sections. It gives depth without weight.

### 3.4 Core Components (restyle the template's `common/` components)

| Component | Spec |
|---|---|
| **Button / primary** | Gold fill, obsidian text, 48px tall (52px mobile CTA), uppercase tracked. Hover: gold-light plus an animated sheen sweep |
| **Button / secondary** | 1px ivory outline, ivory text. Hover: fills ivory, text turns obsidian |
| **Button / link** | Text with a gold underline that draws left→right on hover |
| **Icon button** | 44×44 hit area, 1px steel ring, gold on active |
| **Badge** | Small-caps pill, 10–11px. `NEW` = ivory outline · `−20%` = oxblood fill · `LIMITED` = gold outline · `SOLD OUT` = steel fill. **Max 1 badge per card**, and discounts only show when ≥ 10% |
| **Input** | Graphite fill, steel border; gold border + ring on focus; floating label; inline error in oxblood |
| **Product card** | See Section 6.2 |
| **Drawer** | Right side on desktop (420px), bottom sheet on mobile; backdrop blur 8px |
| **Toast** | Bottom center on mobile, bottom right on desktop; carbon background, gold left rule (library: `sonner`) |
| **Skeleton** | Carbon blocks with a slow shimmer; used for every data-loaded area (no layout shift) |
| **Section heading** | Eyebrow (gold) → H2 (serif) → optional subcopy (smoke), plus a "View all →" link on the right on desktop |

### 3.5 Iconography
- **Lucide** icons at 1.5px stroke, 20px default (the template's icon set can stay for existing icons).
- Custom icons where it matters: COD (hand + taka note), delivery truck, 7-day shield, authenticity seal, WhatsApp.

---

## 4. Imagery & Background Art Direction

### 4.1 Photography rules (the biggest upgrade over both references)
- **One consistent product backdrop**: matte black stone or slate for hero/PDP shots, warm ivory linen for light-section shots.
- **Signature look:** black-glove hand presentation (keeps zero7's strongest idea) with a single soft key light from top-left and a thin rim light.
- Per product: **4–6 images** = front dial, 45° angle, side/crown, caseback, clasp/strap, **on-wrist lifestyle** (this is the hover-swap image).
- Optional: a 6–10s muted vertical video (rotation or wrist shot) for best sellers.

### 4.2 Image specs

| Asset | Size | Ratio | Format | Max weight |
|---|---|---|---|---|
| Product image | 1200×1500 | 4:5 | AVIF + WebP fallback | 180 KB |
| Product thumb (generated) | 400×500 | 4:5 | WebP | 40 KB |
| Hero desktop | 2560×1440 | 16:9 | AVIF/WebP | 350 KB |
| Hero mobile (separate crop) | 1080×1350 | 4:5 | AVIF/WebP | 220 KB |
| Hero video (optional) | 1920×1080, 8–12s loop, muted | 16:9 | MP4 (H.264) + WebM, with poster | 3 MB |
| Category tile | 900×1200 | 3:4 | WebP | 150 KB |
| Promo banner | 1600×900 / mobile 1080×1080 | — | WebP | 200 KB |
| OG / social share | 1200×630 | — | JPG | 200 KB |

Admin uploads are **auto-compressed in the browser** (`browser-image-compression`) before upload, and responsive sizes are served with `srcset`.

### 4.3 Background & texture library
1. **Hero:** macro watch on black stone with a gold rim-light glow; a slow light sweep animates across the crystal.
2. **Dark sections:** obsidian + 3% grain + very faint radial gold glow (top-left).
3. **Ivory sections:** parchment + subtle paper texture (2%).
4. **"Anatomy" section:** pure black with a thin gold line-drawing of a watch (SVG), which animates as it draws.
5. **Brand film band:** a dark close-up of a moving watch movement (balance wheel) as a looped background video.
6. **Newsletter band:** a lifestyle wrist shot (suit cuff, desk, coffee) with a 60% obsidian overlay.

**Placeholder stock (until the client shoots):** Unsplash/Pexels searches such as "luxury watch dark", "wristwatch macro", "watch on wrist suit", "watch movement close up". Real product photos must be the client's own.

---

## 5. Information Architecture & Sitemap

### 5.1 Storefront routes
```
/                      Home (landing)
/shop                  All watches (filters + sort)
/category/:slug        Men · Women · Couple · Automatic/Skeleton · Chain · Leather · Accessories
/collection/:slug      Admin-made collections (e.g. "Eid Edit", "Under ৳1,500")
/product/:slug         Product detail (PDP)
/wishlist              Saved items
/cart                  Full cart page (a cart drawer is also available everywhere)
/checkout              Cash on Delivery checkout
/order/success/:id     Thank-you + order summary
/track-order           Track by phone + order number
/about · /contact · /faq
/policy/:slug          Shipping, Returns & Replacement, Warranty, Privacy, Terms
*                      404 with best sellers
```

### 5.2 Admin routes (`/admin`, lazy-loaded, never in the storefront bundle)
```
/admin/login
/admin                  Dashboard
/admin/orders           List + /admin/orders/:id detail
/admin/products         List + /new + /:id edit
/admin/categories       Categories & collections
/admin/homepage         Homepage builder (sections, hero slides, banners)
/admin/content          Announcement bar, testimonials, FAQ, pages/policies
/admin/coupons
/admin/delivery         Zones & charges
/admin/customers
/admin/reviews
/admin/settings         Brand, contact, social, SEO, tracking pixels
/admin/users            Staff & roles
```

### 5.3 Navigation
- **Desktop header (zero7-style split, refined):**
  `[Men] [Women] [Collections ▾]   —  H O R V E X  —   [Search] [Wishlist •] [Bag • ৳]`
  - "Collections" opens a **mega menu**: columns By Style / By Strap / By Price, plus a featured image card on the right.
  - Header is transparent over the hero, turns solid obsidian with blur after 80px of scroll, hides on scroll-down and shows on scroll-up.
- **Mobile header:** `[☰]  HORVEX  [Search] [Bag]`
- **Mobile bottom tab bar** (sticky, 64px, safe-area aware): `Home · Shop · Wishlist · Bag · Track`. This keeps the main actions within thumb reach and is something neither reference has.
- **Search:** full-screen overlay with instant results (thumbnail + name + price), recent searches, and popular chips.
- **Floating WhatsApp button:** bottom right on desktop; on mobile it sits above the tab bar so the two don't overlap.

---

## 6. Page-by-Page UI/UX Specification

### 6.1 Home (landing): section order

| # | Section | Theme | Purpose | Notes / inspiration |
|---|---|---|---|---|
| 1 | **Announcement bar** | Gold text on obsidian, 36px | Offer | Rotating or marquee messages from admin: "Free delivery over ৳2,999 · Cash on Delivery · 7-Day Replacement" (zero7) |
| 2 | **Header** | Transparent → solid | Navigate | 5.3 |
| 3 | **Hero (cinematic)** | Dark | Desire + CTA | Full viewport (`100svh`). Left: eyebrow "HORVEX · NEW COLLECTION", serif headline "Time, *Refined.*", one-line sub, CTAs **Shop the Collection** (gold) + **Explore Men / Women** (outline). Right: hero watch with parallax and light sweep. Admin slider (max 3) with a 01—02—03 progress indicator (zero7). Mobile: image on top, text below, CTA full width |
| 4 | **Trust marquee** | Carbon strip | Trust | Icons with: Cash on Delivery · Check Before You Pay · 7-Day Replacement · 64-District Delivery · Quality Checked |
| 5 | **Shop by Category** | Dark | Navigate | 4–5 tall tiles (pronoun). Hover: image zoom 1.06, label slides up, gold arrow. Mobile: horizontal snap scroll at 1.3 tiles visible |
| 6 | **Featured products (tabs)** | **Ivory** | Convert | Tabs: Best Sellers · New Arrivals · On Sale. 8 products, "View all" button. Mobile: 2-column grid |
| 7 | **Signature: "Anatomy of a HORVEX"** | Black | Desire + quality | Pinned scroll story (desktop). A watch in the center, and four spec callouts draw in with gold lines: *Crystal* (sapphire-coated), *Case* (316L stainless), *Movement* (Japanese quartz/automatic), *Water resistance* (3–5 ATM). Mobile: a simple stacked version, not pinned. All text editable in admin |
| 8 | **Shop for Him / Shop for Her** | Dark | Convert | Split editorial banner, each side with a lifestyle image and a 4-product mini carousel. Replaces zero7's repeated grids |
| 9 | **Brand film** | Black | Story | pronoun's video block, upgraded: a looped muted background clip, a play button that opens the full film in a modal, and a short brand statement plus CTA |
| 10 | **Promo / Flash sale** | Ivory | Urgency | One or two admin banners in a consistent style; optional **countdown timer** and progress bar showing "62% claimed". Hidden automatically when no promo is active |
| 11 | **How to Order (COD)** | Dark | Trust | zero7's strip, elevated: **① Order** in 30 seconds → **② We Call to Confirm** → **③ Check & Pay on Delivery**, with an animated connecting gold line |
| 12 | **Reviews & UGC** | Ivory | Social proof | Rating summary (4.9★ from N orders), customer photo cards, Facebook review screenshots allowed. Carousel on mobile |
| 13 | **Instagram / Facebook grid** | Dark | Community | 6 tiles linked to the posts |
| 14 | **Join the Circle** | Lifestyle image + overlay | Retention | pronoun's "With You" band: collect **phone (WhatsApp) or email** for early access to drops |
| 15 | **FAQ** | Dark | Remove doubt | COD, delivery time (Dhaka 1–2 days, outside 2–4), warranty, replacement, original box |
| 16 | **Footer** | Obsidian | Trust + links | Logo + statement · Shop links · Help links · Contact (WhatsApp, phone, email, address) · Courier partners · Payment (COD now; bKash/Nagad later) · Socials · © HORVEX |

Every section can be **shown/hidden, reordered and edited** from Admin → Homepage.

### 6.2 Product card (desktop + mobile)
- 4:5 image on carbon; on hover it **crossfades to the lifestyle shot**.
- Top-left: max 1 badge. Top-right: **wishlist heart, always visible** (mobile included).
- Desktop hover: an "Add to Bag" bar slides up from the bottom of the image, plus a "Quick View" eye icon.
- Mobile: a small round **"+"** bag button in the bottom-right of the image (always visible).
- Below the image: category (smoke, small caps) → name (Manrope 500, 1 line clamp) → price `৳1,299` with struck `৳2,100`. No `.00`.
- Optional: color-dot swatches when variants exist.
- Sold out: image desaturated to 60%, "Sold Out" badge, "Notify me" in place of Add.

### 6.3 Shop / Category listing
- Header band with category name (serif), product count, short description and a breadcrumb.
- **Filters:** Category, Gender, Price range (dual slider), Strap (Chain / Leather / Silicone / Mesh), Dial color (swatches), Movement, Availability. Desktop: sticky left sidebar. Mobile: **bottom-sheet** filters with an "Apply (24)" button.
- **Sort:** Featured, Newest, Price ↑, Price ↓, Best selling.
- Active filters shown as removable chips. Filters sync to the URL so links can be shared.
- Pagination: "Load more" button with a count ("Showing 24 of 68"). Infinite scroll is avoided so the footer stays reachable.
- Empty state: an illustration, "No watches match" and a "Clear filters" button.

### 6.4 Product detail page (PDP): the main converter
- **Gallery:** desktop = vertical thumbnails + large image with **hover zoom (lens)** and click for a full-screen lightbox. Mobile = **swipe carousel with dots + pinch zoom**.
- **Buy box (sticky on desktop):** breadcrumb → name (serif H1) → rating stars (n reviews) → price, compare-at price and "Save ৳800" → short description → variant selectors (dial color/strap as image swatches) → quantity stepper → stock line ("Only 3 left", in amber) →
  - **[ Order Now: Cash on Delivery ]** (gold, primary; goes straight to checkout with this item)
  - **[ Add to Bag ]** (outline) · **[ ♡ ]**
  - **[ Order via WhatsApp ]** (text link, prefilled message with product name and link)
- **Trust row under the buttons:** COD · Check before pay · 7-day replacement · Delivery estimate ("Dhaka: by Thu, 23 Oct").
- **Tabs/accordion:** Description · Specifications (table: case size, case material, strap, movement, glass, water resistance, weight, warranty, box contents) · Delivery & Returns · Reviews.
- **What's in the box** visual row (watch, HORVEX box, warranty card, extra links).
- **"Complete the look" / "You may also like"** carousel.
- **Mobile sticky bottom bar** shows the price plus an "Order Now" button once the main button scrolls out of view.
- Recently viewed strip (localStorage).

### 6.5 Wishlist
- Guest wishlist saved in localStorage; heart counter in the header and tab bar.
- Grid of saved items with **"Move to Bag"** and remove. Share-list link optional (phase 2).
- Empty state: "Your wishlist is waiting" plus best sellers.

### 6.6 Cart (drawer + page)
- **Drawer** opens on Add to Bag (with a fly-to-bag animation), showing line items with thumbnail, variant, qty stepper and remove; subtotal; a **free-delivery progress bar** ("Add ৳700 more for FREE delivery"); upsell of one accessory; buttons **Checkout** (gold) and **View Bag**.
- **Cart page:** the same plus a coupon field and delivery estimate.
- Prices are always re-validated from the server at checkout (the client's cart is never trusted).

### 6.7 Checkout: Cash on Delivery (one page, guest, about 30 seconds)
**Layout:** desktop = form left + sticky order summary right. Mobile = collapsible "Show order summary (৳3,450)" on top, then the form, then a sticky bottom "Confirm Order" button.

**Fields (minimum friction):**
1. Full name *
2. Mobile number * (BD format `01XXXXXXXXX`, validated, numeric keypad on mobile)
3. Full address * (house, road, area)
4. Delivery area * (segmented control): **Inside Dhaka ৳70** / **Dhaka Sub-area ৳100** / **Outside Dhaka ৳130**. The total updates live. Values come from admin settings.
5. District (searchable select, shown for Outside Dhaka)
6. Email (optional; used for the receipt)
7. Order note (optional)
8. Coupon code (collapsible "Have a coupon?")

**Payment block:** a single selected card, "Cash on Delivery: pay when you receive and check your watch", with an icon. Disabled placeholders for bKash/Nagad marked "Coming soon" are optional.

**Button:** `CONFIRM ORDER · ৳3,450`, with the note below it: "Our team will call you within a few hours to confirm."

**After submit → `/order/success/:id`:** an animated check (gold ring that draws like a watch hand), the order number `HVX-10245`, a summary, "What happens next" (the 3-step timeline), WhatsApp us, Continue shopping. The cart is cleared and the Purchase event is fired.

**Anti-fake-order protection (big issue for COD in BD):**
- Server-side validation of phone format, rate limits per phone and IP (e.g. 3 orders / hour), and a hidden honeypot field.
- An admin **block list** (phone numbers that repeatedly refuse delivery).
- Customer history badge in admin (delivered vs. cancelled ratio).
- Optional phone **OTP** for orders above a threshold (phase 2, via SMS gateway).

### 6.8 Track order
- Inputs: phone plus order number → a status timeline: Placed → Confirmed → Packed → Shipped (courier + tracking ID link) → Delivered.

### 6.9 About · Contact · FAQ · Policies
- About: brand story, craftsmanship values, team/warehouse photo.
- Contact: WhatsApp / phone / email cards, a form (stored in DB and shown in admin), map embed optional.
- Policies are written in admin (rich text).

---

## 7. Animation & Motion Plan

**Tools:** `motion` (Framer Motion) for UI and layout animations · `lenis` for smooth scrolling on desktop · the template's `Reveal` + `useInView` for simple reveals. GSAP ScrollTrigger is **only** used if the pinned "Anatomy" section needs it.

**Motion tokens**
- Durations: `fast 150ms` (hover/press) · `base 250ms` (UI) · `slow 450ms` (drawers/modals) · `reveal 700ms` (scroll reveals).
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (expo-out, the default) · `cubic-bezier(0.65, 0, 0.35, 1)` (in-out, for page transitions).
- Only `transform` and `opacity` are animated, keeping everything on the GPU.

| # | Animation | Where | Detail |
|---|---|---|---|
| 1 | **Preloader** | First visit per session | Monogram bezel ticks fill like a second hand (≤ 1.2s), then the wordmark fades up. Skipped on later page views |
| 2 | **Hero headline** | Hero | Line-by-line mask reveal (text slides up from a clip), 80ms stagger |
| 3 | **Light sweep** | Hero watch, product images on hover | A diagonal white gradient (10% opacity) passes across the crystal every 6s |
| 4 | **Parallax** | Hero, category tiles, brand film | Image moves at 0.85× scroll speed (desktop only) |
| 5 | **Rotating bezel ring** | Behind hero watch | SVG minute-track ring that rotates slowly with scroll |
| 6 | **Marquee** | Trust strip | Infinite, slow (40s loop), pauses on hover |
| 7 | **Scroll reveals** | All sections | Fade-up 16px with stagger for grids (cap 6 items × 60ms) |
| 8 | **Product card hover** | Cards | Image crossfade + scale 1.04; Add-to-Bag bar slides up |
| 9 | **Fly-to-bag** | Add to Bag | The thumbnail clones and arcs to the bag icon; the counter bounces; the drawer opens |
| 10 | **Heart burst** | Wishlist | Fill animation + 6 tiny gold particles |
| 11 | **Anatomy draw** | Signature section | SVG stroke draws in, callouts fade in tied to scroll progress |
| 12 | **Magnetic CTA** | Primary hero buttons (desktop) | Button follows the cursor by max 6px |
| 13 | **Counter roll** | Reviews stats | Numbers count up when visible |
| 14 | **Route transition** | Page change | 250ms fade + 8px rise; scroll restored correctly |
| 15 | **Success check** | Order success | Gold ring draws, then a check pops in |

**Rules:** no custom cursor (hurts usability), no animation that blocks interaction, and `prefers-reduced-motion` turns everything into instant changes (the template's global override already exists, so keep it). Lenis is disabled on touch devices.

---

## 8. Mobile UX Checklist

- Designed at **360px first**, then scaled up.
- Tap targets ≥ 44×44px; primary CTAs are full width and 52px tall.
- Bottom tab bar + sticky PDP buy bar + sticky checkout button: the important actions sit in the thumb zone.
- Filters and cart open as bottom sheets with swipe-down to close.
- Numeric keypad for the phone field (`inputmode="tel"`), `autocomplete` attributes on all fields.
- Hero uses a separate mobile crop and `100svh` (no iOS address-bar jump).
- **Test inside the Facebook and Instagram in-app browsers.** Most BD watch buyers arrive from FB ads, and those browsers have quirks with fixed elements and storage.
- Safe-area insets for iPhone notch and home bar.

---

## 9. Technical Architecture

### 9.1 Stack decision

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Keep the template:** React 19 + Vite 8 + Tailwind 3.4 | Saves the most time; its components, tokens, a11y and reveal system are already done |
| Routing | `react-router` v7 (library mode) | Multi-page store + admin |
| Server data | `@tanstack/react-query` | Caching, loading/error states, refetch |
| Client state | `zustand` + `persist` | Cart, wishlist, recently viewed (localStorage) |
| Forms | `react-hook-form` + `zod` | Checkout and all admin forms; shared validation schemas |
| Animation | `motion`, `lenis` | Section 7 |
| Carousels | `embla-carousel-react` | Lightweight, touch-friendly |
| Toasts | `sonner` | Small, nice defaults |
| SEO tags | React 19 native `<title>`/`<meta>` in components | No extra library needed |
| **Backend** | **Supabase**: Postgres, Auth, Storage, Realtime, Edge Functions | Full database + admin auth + image storage without writing a server; free tier is enough to launch |
| Admin extras | `@tanstack/react-table`, `recharts`, `@dnd-kit` (reorder), `tiptap` (rich text), `browser-image-compression` | Lazy-loaded, admin only |
| Hosting | **Vercel** (frontend) + Supabase (backend) | Free/cheap, HTTPS, CI deploy from Git |
| Domain | e.g. `horvex.com.bd` or `horvex.shop` | Client purchase |

> **SEO trade-off:** a Vite SPA is weaker for Google than Next.js. It's acceptable here because most traffic will come from Facebook/Instagram ads. We mitigate it with per-page meta, prerendering of key pages (home, categories, top products), `sitemap.xml`, `robots.txt` and Product JSON-LD. If organic SEO becomes a priority later, migrating to Next.js is a phase-2 option.

### 9.2 Folder structure (evolving the template)
```
src/
  app/            router.jsx, providers.jsx, routes guards
  components/
    common/       (template) Button, Badge, Card, Container, Reveal, SectionHeading + Input, Drawer, Modal, Skeleton, Price, Rating
    layout/       (template) AnnouncementBar, Navbar, Footer + MegaMenu, SearchOverlay, MobileTabBar, CartDrawer, WhatsAppFab
    home/         (template, restyled) Hero, TrustFeatures, CategoryShowcase, ... + Anatomy, BrandFilm, HowToOrder
    product/      ProductCard, ProductGrid, Gallery, BuyBox, SpecsTable, VariantPicker, StickyBuyBar
    shop/         Filters, SortSelect, FilterSheet, ActiveChips
    checkout/     CheckoutForm, OrderSummary, AreaSelector, CouponField
  pages/          Home, Shop, Category, Product, Wishlist, Cart, Checkout, OrderSuccess, TrackOrder, About, Contact, Faq, Policy, NotFound
  admin/
    layout/       AdminShell, Sidebar, Topbar
    pages/        Dashboard, Orders, OrderDetail, Products, ProductEdit, Categories, Homepage, Content, Coupons, Delivery, Customers, Reviews, Settings, Users
    components/   DataTable, ImageUploader, StatusPill, RichText, SortableList
  store/          cart.js, wishlist.js, ui.js, recentlyViewed.js
  services/       supabase.js, products.js, orders.js, content.js, settings.js
  lib/            format.js (৳ formatter), validators.js (zod), constants.js, analytics.js
  hooks/          (template) useInView + useMediaQuery, useScrollDirection
  styles/         index.css, fonts.css
```

### 9.3 Template reuse map

| Template file | HORVEX use | Change level |
|---|---|---|
| `AnnouncementBar` | Admin-driven rotating/marquee offers | Restyle + data |
| `Navbar` | Split-logo header, mega menu, counters, scroll hide/show | Major extend |
| `Footer` | HORVEX footer + courier/payment rows | Restyle + data |
| `Hero` | Cinematic slider | Rebuild visuals, keep structure |
| `TrustFeatures` | COD / replacement / delivery strip (marquee) | Restyle |
| `CategoryShowcase` | Image category tiles | Restyle + real images |
| `BestSellers` + `NewArrivals` | One tabbed "Featured" section | Merge |
| `ProductCard` | Real images, store-connected wishlist/cart, ৳ prices | Extend (keep `memo`, a11y labels) |
| `PromoBanner` | Flash sale + countdown | Extend |
| `BrandStory` | Brand film block | Restyle + video |
| `WhyChooseUs` | "How to Order (COD)" | Repurpose |
| `CustomerReviews` + `TestimonialCard` | Reviews & UGC | Extend with photos |
| `SocialShowcase` | Instagram grid | Real images |
| `Newsletter` | "Join the Circle" (phone/email) | Extend |
| `FAQ` | FAQ (admin data) | Data |
| `FinalCTA` | Optional; may be dropped | Decide in Phase 4 |
| `common/*`, `useInView`, `Reveal` | Keep as the foundation | Re-token |
| `index.css` reduced-motion override | Keep | None |
| `tailwind.config.js` | Replace tokens with Section 3 | Rewrite theme |
| `data/*.js` | Becomes seed/fallback data; real data from Supabase | Replace |

### 9.4 Database schema (Supabase / Postgres)

| Table | Key fields |
|---|---|
| `products` | id, slug, name, sku, category_id, gender, short_desc, description (rich), price, compare_at_price, cost_price (admin only), stock, low_stock_at, status (draft/active/archived), badges[], specs (jsonb: case_size, case_material, strap, movement, glass, water_resistance, weight, warranty, box_contents), is_featured, is_bestseller, sort_order, seo_title, seo_desc, created_at |
| `product_images` | id, product_id, url, alt, is_lifestyle, sort_order |
| `product_variants` | id, product_id, name (e.g. "Black / Steel"), sku, price_override, stock, swatch_hex, image_id |
| `categories` | id, slug, name, image, description, parent_id, sort_order, is_visible |
| `collections` + `collection_products` | id, slug, title, banner, rules/manual list, active_from/to |
| `orders` | id, order_number (HVX-xxxxx), customer_name, phone, email, address, district, zone_id, delivery_charge, subtotal, discount, coupon_code, total, payment_method ('COD'), status, courier, tracking_id, customer_note, admin_note, ip, user_agent, created_at |
| `order_items` | id, order_id, product_id, variant_id, name_snapshot, image_snapshot, unit_price, qty |
| `order_status_history` | id, order_id, from, to, changed_by, note, created_at |
| `delivery_zones` | id, name, charge, eta_text, sort_order, is_active |
| `coupons` | id, code, type (percent/fixed/free_shipping), value, min_order, max_uses, used, starts_at, ends_at, is_active |
| `reviews` | id, product_id, name, rating, text, photo_url, status (pending/approved), created_at |
| `hero_slides` | id, eyebrow, title, subtitle, cta_label, cta_link, image_desktop, image_mobile, video_url, sort_order, active_from/to |
| `banners` | id, placement, title, image, link, countdown_to, is_active |
| `home_sections` | id, key (hero, categories, featured, anatomy, ...), title, subtitle, config (jsonb), sort_order, is_visible |
| `site_settings` | single row: brand name, logos, contact phone/WhatsApp/email/address, socials, announcement messages, free_delivery_threshold, seo defaults, ga4_id, fb_pixel_id |
| `pages` | slug, title, content (rich), updated_at |
| `faqs`, `testimonials` | content + sort_order + visibility |
| `subscribers` | phone/email, source, created_at |
| `contact_messages` | name, phone, message, status |
| `blocked_phones` | phone, reason, created_at |
| `admin_profiles` | user_id, name, role (owner/manager/staff) |
| `activity_log` | actor, action, entity, entity_id, diff, created_at |

**Security**
- **Row Level Security on every table.** The public can read only active products/content. Orders **cannot** be inserted directly; they go through a **`place_order` Postgres function / Edge Function** that:
  1. re-reads prices from the DB (ignores client prices),
  2. checks stock and decrements it atomically,
  3. validates and applies the coupon,
  4. calculates delivery from `delivery_zones` and the free-delivery threshold,
  5. checks rate limits and `blocked_phones`,
  6. writes the order + items and returns the order number.
- Admin access requires Supabase Auth plus a role in `admin_profiles`. `cost_price` and orders are only readable by admins. The service key is **never** shipped to the browser.
- Optional: TOTP 2FA for the owner account (Supabase MFA).
- Daily DB backups (Supabase Pro) or a scheduled CSV export.

---

## 10. Admin Panel: "Control the Whole Website"

**Design:** the same brand but functional. Manrope only, light/dark toggle, sidebar navigation (collapses to a bottom bar on mobile). **Fully usable on a phone**, because the owner will confirm orders from a phone.

| Module | Features |
|---|---|
| **Dashboard** | Today: orders, revenue, pending confirmations, delivered rate · 30-day revenue chart · top 5 products · low-stock alerts · latest orders. **Realtime new-order alert** (sound + badge via Supabase Realtime) |
| **Orders** | Table with status tabs (Pending, Confirmed, Packed, Shipped, Delivered, Cancelled, Returned), search by phone/order no., date filter · Detail: items, customer, **Call** (`tel:`) and **WhatsApp** buttons, change status (logged), admin notes, courier + tracking ID, customer history badge, **Print invoice / packing slip**, Block phone · Bulk status update · **CSV export** |
| **Products** | List with thumbnails, stock, status, quick toggles · Editor: name, slug (auto), descriptions (rich text), price/compare-at/cost, stock, SKU, category, gender, badges, specs fields, variants, **drag-drop image upload with reorder + lifestyle flag**, SEO fields, Draft/Publish, Duplicate product |
| **Categories & Collections** | CRUD, image, description, reorder, visibility; collections with schedule dates |
| **Homepage builder** | **Drag to reorder sections, toggle visibility**, edit each section's title/subtitle/config · Hero slides CRUD (desktop + mobile image, video, CTA, schedule) · Promo banners with countdown · Anatomy callouts text · Brand film URL |
| **Content** | Announcement bar messages, FAQ, testimonials, policy pages (rich text), About page |
| **Coupons** | Percent / fixed / free shipping, min order, limit, dates, usage count |
| **Delivery** | Zones and charges, ETA text, free-delivery threshold |
| **Customers** | Auto-built from orders: name, phone, orders count, total spent, delivered/cancelled ratio, block/unblock |
| **Reviews** | Approve/reject, add a review manually (e.g. from a Facebook comment), attach photo |
| **Settings** | Logo/favicon, contact info, WhatsApp number, socials, footer text, SEO defaults, OG image, GA4 + Meta Pixel IDs, maintenance mode |
| **Users** | Invite staff, roles: **Owner** (everything), **Manager** (all except users/settings), **Staff** (orders only) |
| **Activity log** | Who changed what, and when |

Notifications on new orders (pick at least one): admin realtime alert (built in) · email via Edge Function (Resend) · **Telegram bot message** (free, instant, popular with BD shop owners).

---

## 11. Formatting & Localization
- Currency: `৳1,299`, using `Intl.NumberFormat('en-IN')` so lakh grouping works (`৳1,25,000`). No decimals.
- Dates: `19 Oct 2026`; delivery ETAs in plain words ("by Thursday").
- Phone: store as `+8801XXXXXXXXX`, display as `01XXX-XXXXXX`.
- **Optional bilingual (EN / বাংলা)** toggle in phase 2. Keep all UI strings in one `strings.js` from the start so adding Bangla later is easy.

---

## 12. SEO, Analytics & Marketing
- Per-page `<title>` and meta description, canonical URLs, OG/Twitter cards (product image + price).
- **JSON-LD:** `Organization`, `WebSite` (search), `Product` with `Offer` (price in BDT, availability) and `AggregateRating`, `BreadcrumbList`, `FAQPage`.
- `sitemap.xml` (generated from products/categories) and `robots.txt` (block `/admin`, `/checkout`).
- **GA4 + Meta Pixel** with e-commerce events: `PageView`, `ViewContent`, `AddToWishlist`, `AddToCart`, `InitiateCheckout`, `Purchase` (with value + currency BDT). Pixel IDs are set in admin, not hardcoded.
- Phase 2: Meta Conversions API from an Edge Function (better ad tracking, since iOS blocks much of the pixel).

---

## 13. Performance & Accessibility Targets

| Metric | Target (mid-range Android, 4G) |
|---|---|
| LCP | < 2.5s (hero image preloaded, AVIF) |
| CLS | < 0.1 (fixed aspect ratios, skeletons) |
| INP | < 200ms |
| Storefront JS (initial, gzipped) | < 200 KB; admin is a separate lazy chunk |
| Lighthouse | Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 95 |

- Fonts: self-hosted woff2, Latin subset, `font-display: swap`, display font preloaded.
- Images: `loading="lazy"` below the fold, `fetchpriority="high"` on the hero, `srcset` + `sizes`.
- Code splitting per route; videos load only when in view.
- Accessibility (template work continues): skip link, `<main>` landmark, focus rings (gold on dark), aria labels on icon buttons, keyboard-operable drawers/modals with focus trap and ESC, form errors announced, contrast AA everywhere, reduced motion respected.

---

## 14. Build Roadmap (phase by phase)

> Estimates assume one developer working full days. Total ≈ **6–7 weeks** to launch.

| Phase | Name | Scope | Est. | Acceptance criteria |
|---|---|---|---|---|
| **0** | Project setup & audit | Copy template into `HORVEX/`, rename package, `git init`, install deps, `.env.example`, remove template demo data, add router skeleton | 0.5 d | `npm run dev/build/lint` clean; routes render placeholders |
| **1** | Brand & design system | Tailwind tokens (colors, fonts, scale, radius, motion), self-hosted fonts, grain texture, restyle `common/` components, new Input/Drawer/Modal/Skeleton/Price, ৳ formatter, logo placeholder | 2 d | A style-guide route (removed before launch) shows all tokens/components on dark + ivory |
| **2** | Backend foundation | Supabase project, full schema (9.4), RLS policies, storage buckets, `place_order` function, seed ~24 products + categories + settings | 2 d | Seeded data readable publicly; order insert works only through the function; admin-only tables blocked for anon |
| **3** | Layout shell | Announcement bar, split header + mega menu, scroll behavior, search overlay, mobile menu + **bottom tab bar**, footer, WhatsApp FAB, route transitions, Lenis | 2 d | Navigation works on 360px → 1920px; keyboard accessible |
| **4** | Home landing | All 16 sections from 6.1, wired to Supabase content (`home_sections`, slides, banners) with skeletons | 4 d | Matches spec; sections hide/reorder from DB values |
| **5** | Shop & category | Listing, filters (sidebar + bottom sheet), sort, URL sync, load more, empty state | 2 d | Filters combine correctly; URL shareable; mobile sheet works |
| **6** | Product detail | Gallery (zoom, swipe, lightbox), variants, buy box, trust row, specs/tabs, related, recently viewed, sticky mobile buy bar | 2.5 d | Variant changes price/stock/image; works without hover |
| **7** | Wishlist & cart | Zustand stores (persisted), cart drawer, cart page, free-delivery progress, fly-to-bag, heart burst | 1.5 d | Survives refresh; counters update everywhere |
| **8** | COD checkout & orders | Checkout form + zod validation, zones/coupon live totals, `place_order` call, success page, track order, anti-fake measures | 2.5 d | Real order appears in DB with server-calculated totals; tampered prices are rejected; rate limit works |
| **9** | Admin foundation | Admin login, role guard, shell (sidebar/topbar, mobile layout), dashboard KPIs + chart, realtime new-order alert | 2 d | Non-admin can't access; dashboard numbers match DB |
| **10** | Admin: catalog | Products CRUD with image upload/compress/reorder, variants, specs; categories & collections | 3 d | Product created in admin appears on the site immediately |
| **11** | Admin: orders & customers | Orders table/tabs/detail, status pipeline + history, call/WhatsApp, invoice print, CSV export, customers, block list | 2 d | Full order lifecycle can be run from a phone |
| **12** | Admin: CMS & settings | Homepage builder (drag reorder/visibility), hero slides, banners, announcement, content pages, FAQ, testimonials, reviews moderation, coupons, delivery zones, site settings, users/roles, activity log | 3 d | Every visible text/image on the home page is editable without code |
| **13** | Motion polish | Preloader, hero reveal + light sweep + bezel ring, Anatomy pinned section, magnetic CTAs, counters, success animation; reduced-motion pass | 2 d | 60fps on mid-range Android; nothing blocks input |
| **14** | SEO, analytics, performance, a11y | Meta, JSON-LD, sitemap, robots, prerender key pages, GA4 + Pixel events, image/font/code-split optimization, a11y audit | 2 d | Lighthouse targets met (Section 13); events visible in Pixel helper |
| **15** | QA, launch & handover | Device/browser matrix test, real content upload, domain + Vercel + env, backups, remove style guide, **admin user guide (PDF + short screen recording)** | 2 d | Client signs off on a test order flow end-to-end |

### Test matrix (Phase 15)
- **Devices:** iPhone SE (375), iPhone 14/15 (390–393), Samsung A-series (360/412), iPad (768/1024), laptop 1366, desktop 1440/1920.
- **Browsers:** Chrome (Android/desktop), Safari (iOS/macOS), Samsung Internet, Firefox, **Facebook + Instagram in-app browsers**.
- **Flows:** browse → filter → PDP → wishlist → cart → checkout → admin sees order → status updates → track page shows them.

---

## 15. Phase 2 (post-launch upgrades)
1. **Courier API integration** (Steadfast / Pathao / RedX): one-click consignment from an order, auto tracking ID.
2. **SMS notifications** (order placed / confirmed / shipped) via a BD SMS gateway; optional OTP for high-value COD.
3. **Online payments:** bKash, Nagad, SSLCommerz (partial advance payment to reduce fake orders).
4. Customer accounts (phone OTP login), order history, synced wishlist.
5. Bangla language toggle.
6. Abandoned-checkout capture (phone entered but not submitted, shown in admin for a follow-up call).
7. Product compare, gift wrapping + gift message, engraving option.
8. Warranty registration page (QR code on the warranty card).
9. Meta Conversions API and Google Merchant feed.

---

## 16. What We Need From the Client (checklist)
- [ ] Final logo files (or approval to design one from the placeholder direction)
- [ ] Tagline choice (Section 2.1)
- [ ] Product list: name, price, compare-at price, stock, specs, 4–6 photos each
- [ ] Category list and which collections to launch with
- [ ] Delivery charges per zone + free-delivery threshold + ETAs
- [ ] Policies: return/replacement, warranty, privacy, terms
- [ ] Contact: phone, WhatsApp, email, address; social links
- [ ] Courier partner name; Meta Pixel ID; GA4 access
- [ ] Domain + hosting account access (or approval to create them)
- [ ] Lifestyle/hero photos or a shoot budget (Section 4)

---

## 17. Rough Running Costs
| Item | Cost |
|---|---|
| Vercel Hobby/Pro | Free to start; Pro ~$20/mo if needed |
| Supabase | Free to launch; **Pro $25/mo recommended** after launch (daily backups, no pausing) |
| Domain `.com.bd` / `.shop` | ~৳1,500–3,000 / year |
| Email (Resend) | Free tier |
| SMS (phase 2) | ~৳0.25–0.40 per SMS |

---

## 18. Definition of Done (for the whole project)
- A customer can find, save, add, and order a watch with COD on a 360px phone in **under 60 seconds**.
- The owner can add a product, change the hero, run a sale, and process an order **from a phone, without a developer**.
- Lighthouse and accessibility targets are met, there are no console errors, and the reduced-motion mode works.
- Every number shown to the customer (price, delivery, total) is recalculated on the server.
- It looks and feels like a real luxury watch brand, not a template.
