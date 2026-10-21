# WRISTORY: launch checklist

Everything here is a 👤 step: it needs a dashboard login, a real device or a decision from the client. Do the sections in order; tick each box as you go. Written in C6c (2026-10-21). C6a (admin UI) and C6b (customer accounts) may add steps, so check their notes in `plan.md` before you start.

## 1. Database (Supabase SQL Editor)

Migrations are applied by pasting the file into **Supabase → SQL Editor → Run**, oldest first. Each test script rolls itself back, so it never leaves data behind.

State of the live project as read from the storefront API on 2026-10-21:

| Migration | State | Then run |
|---|---|---|
| `20261020100000_b3c_courier_partners.sql` | ✅ applied (`site_settings.courier_partners` exists) | – |
| `20261020110000` … `20261020150000` (realtime, settings, users, restock, list offsets) | ✅ applied 2026-10-20 | `b29b_settings_check.sql`, `b29c_users_check.sql` (results never confirmed) |
| `20261021100000_c5_security.sql` | ❌ **not applied** (`orders.stock_restored` is missing) | `c5_security_check.sql` → "C5 security checks passed" |
| `20261022100000_rebrand_wristory_copy.sql` | looks applied (no "HORVEX" in public rows); safe to run again (idempotent), it also fixes draft rows the storefront can't see | – |
| `20261023100000_contact_details.sql` | looks applied (Facebook link is live); safe to run again | – |
| C6b customer-auth migration(s), if any | see C6b's note in `plan.md` | its check script |

- [ ] Run `supabase/migrations/20261021100000_c5_security.sql`.
- [ ] Run `supabase/tests/c5_security_check.sql`; it must print **C5 security checks passed**.
- [ ] Run `supabase/tests/b29b_settings_check.sql` and `supabase/tests/b29c_users_check.sql`; both must pass.
- [ ] Run `20261022100000_rebrand_wristory_copy.sql` once more (catches draft/hidden rows).
- [ ] Apply C6b's migration(s) and their check, if C6b added any.
- [ ] Optional decision: order numbers still start with `HVX-` (from the old HORVEX name; it's in the schema check, `place_order` and `track_order`). Changing the prefix needs a small migration; say if you want it before the first real order.

## 2. Supabase project settings

- [ ] **Auth → Providers / Sign-ups:** C5 said "turn off public sign-ups" because only admins signed in. C6b adds customer email accounts, which need sign-ups **on**. Follow C6b's note; if customer accounts don't ship at launch, turn sign-ups off.
- [ ] **Auth → URL configuration:** Site URL = the live domain; add `https://<domain>/**` (and the Vercel preview domain if you test there) to the redirect allow list (needed for email confirmation / password reset links).
- [ ] **Auth → Password security:** turn on leaked-password protection; set a minimum length (10+).
- [ ] Change the owner account's weak password (Admin login). Optional: owner TOTP (not built into the admin yet).
- [ ] **Backups:** the free plan has no downloadable backups and pauses after a week without traffic. Upgrade to **Pro ($25/mo)** before launch: daily backups kept 7 days, no pausing. Point-in-time recovery (PITR) is a paid add-on on top of Pro; turn it on only if losing up to a day of orders is not acceptable.
- [ ] Until Pro is on: export the database once a week (Database → Backups, or `pg_dump` with the DB password) and keep a copy off Supabase.

## 3. Domain, Cloudflare Pages and production env

- [ ] Buy the domain (`.com.bd` or `.shop`, about ৳1,500–3,000 a year).
- [ ] Cloudflare dashboard → Workers & Pages → Create → **Pages → Connect to Git** → the GitHub repo. Framework preset None; build command `npm run build`; output directory `dist`; production branch `main`. `public/_headers` (CSP, HSTS, caching) ship inside `dist`. The free plan allows commercial use.
- [ ] Pages → Settings → Variables and Secrets (Production and Preview; set `NODE_VERSION` = `22` too):
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as the local `.env`; the anon/publishable key only, never `service_role`).
  - `VITE_SITE_URL` = `https://<your-domain>` (no trailing slash). Without it, canonicals, `og:url` and `sitemap.xml` are skipped.
- [ ] Pages → Custom domains: add the apex and `www` (the domain is already on Cloudflare DNS, so the records are created for you); redirect one to the other with a Redirect Rule.
- [ ] Redeploy after setting the env vars (they are baked in at build time).
- [ ] Open the live site with DevTools → Console on home, a product, checkout and `/admin`: no "Content-Security-Policy" errors. If you later add a new image host, video host, chat widget or analytics tool, add its origin to the `Content-Security-Policy` line in `public/_headers`, or it will be blocked.

## 4. Analytics and SEO

GA4 and Pixel IDs are **not env vars**: they are read from the database.

- [ ] Admin → Settings → Tracking IDs: enter the GA4 measurement ID (`G-…`) and the Meta Pixel ID (digits). Nothing loads while both are empty.
- [ ] Admin → Settings → Brand: upload a share image (OG image, 1200×630) and a favicon.
- [ ] GA4 → DebugView and Meta **Pixel Helper** (Chrome extension): browse, add to bag, start checkout; `page_view`, `view_item`, `add_to_cart`, `begin_checkout` arrive. The test order in §7 should show `purchase` / `Purchase` once.
- [ ] Google **Rich Results Test** on a product URL and `/faq` (Product + FAQ detected, no errors).
- [ ] Google Search Console: verify the domain, submit `https://<domain>/sitemap.xml`.
- [ ] After bulk product edits, redeploy (or add a Pages deploy hook) so prerendered titles/prices in `sitemap.xml` and the page heads refresh.

## 5. Content and test data

- [ ] Delete the test orders **HVX-10001** and **HVX-10002** (Supabase → Table editor → `orders`; their `order_items` go with them). Cancel them first in the admin if you want the stock back.
- [ ] Delete the product **QA Test Watch** (Admin → Products).
- [ ] Replace the mock products with the real catalogue (the client does this by hand in Admin → Products): name, price, compare-at price, stock, specs, 4–6 photos each.
- [ ] Replace the placeholder Unsplash photos (hero slides, category tiles, collection banners, promo banners); some show other brands' dials.
- [ ] Replace the draft copy: About, Shipping, Returns & Replacement, Warranty, Privacy, Terms (Admin → Content → Pages) and the FAQ.
- [ ] Admin → Settings → Contact: phone and address are still empty (WhatsApp, email and Facebook are set). Courier partners list is empty (footer row hidden until filled).
- [ ] Check the announcement bar text matches the free-delivery amount (it once said ৳4,999 while the threshold is ৳5,000).
- [ ] Delivery zones and charges (Admin → Delivery) match the client's real rates and ETAs.

## 6. Performance and device checks (live URL)

- [ ] Lighthouse (Chrome DevTools, mobile) on the live home, a product, `/shop` and checkout. C4 measured 79–87 locally under simulated slow 4G; record the live numbers in `plan.md`.
- [ ] A real mid-range Android (Samsung A-series) on 4G: home loads in ~3 s, scrolling and the menu feel smooth, add to bag and checkout work.
- [ ] The device/browser checks from the C6c QA that need real hardware (see `plan.md`, C6c note): iPhone Safari, Samsung Internet, Firefox, and the **Facebook and Instagram in-app browsers** (open the site link from a Messenger chat and an Instagram bio/story).

## 7. Final end-to-end test (the client)

- [ ] The client, on their own phone: browse → filter → open a product → wishlist → add to bag → checkout (real name/phone) → order success page shows the number.
- [ ] Admin (desktop and phone): the new-order alert appears; open the order; move it confirmed → packed → shipped (add courier + tracking ID).
- [ ] Storefront → Track order with that number + phone shows each status.
- [ ] Cancel the order in the admin (stock comes back), then delete it in Supabase → Table editor → `orders`, so the shop starts clean.

## 8. Still open from the client checklist (roadmap §16)

- [ ] Final logo files (a logo image is uploaded in settings, but the header, footer and invoice still use the text wordmark; apple-touch-icon / OG image need it too).
- [ ] Tagline choice.
- [ ] Real product list with photos (see §5).
- [ ] Category list and which collections to launch with.
- [ ] Delivery charges per zone, free-delivery threshold, ETAs (confirm the seeded values).
- [ ] Final policies: returns/replacement, warranty, privacy, terms.
- [ ] Contact: phone and address (WhatsApp, email, Facebook done); Instagram/TikTok links if any.
- [ ] Courier partner name; Meta Pixel ID; GA4 access.
- [ ] Domain + Cloudflare/Supabase account access (or approval to create them in the client's name).
- [ ] Lifestyle/hero photos or a shoot budget.

## 9. Running costs (roadmap §17)

| Item | Cost | Decision |
|---|---|---|
| Cloudflare Pages | Free plan allows commercial use | [x] chosen (moved from Vercel) |
| Supabase | Free to start; **Pro $25/mo** recommended from launch (daily backups, no pausing); PITR is an extra add-on | [ ] upgrade |
| Domain `.com.bd` / `.shop` | ~৳1,500–3,000 / year | [ ] buy |
| Email (Resend), when order emails are added | Free tier | – |
| SMS (phase 2) | ~৳0.25–0.40 per SMS | – |
