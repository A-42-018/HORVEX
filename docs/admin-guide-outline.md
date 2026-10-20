# WRISTORY admin user guide: outline

> **Draft outline, to be finalized after C6a's admin UI refresh is merged.** C6a is changing the admin layout, navigation and product pages, so screenshot names and click paths below are placeholders. After the merge: walk each section on the new UI, fix the paths, take the screenshots, then produce the PDF (and the short screen recording, roadmap C6). Don't take screenshots from the current UI.

**Audience:** the shop owner and staff, no technical background. **Format:** A4 PDF, one section per task, numbered steps with a screenshot per step group; plus a 5–8 minute screen recording of sections 2–4. Language: English (Bangla version optional). Screenshots at desktop 1440 unless marked 📱 (phone, 390 wide).

**Screenshot rules:** use the live site after test data is removed; blur customer names/phones (use a staff test order); same browser zoom for all; mark click targets with a numbered gold circle.

---

## 1. Getting started
- What the admin is for, who sees what (roles: **owner**, **manager**, **staff**; table of which pages each role opens).
- Signing in at `/admin/login`, signing out, forgotten password (the owner resets it in Supabase for now).
- The layout: sidebar (desktop), bottom tab bar + menu (📱), page header, save bar.
- Screenshots: `01-login`, `02-dashboard-desktop`, `03-dashboard-phone` 📱, `04-role-table` (made in the doc, not a screenshot).

## 2. Daily work: orders (all roles)
- Dashboard: today's orders, revenue chart, low stock; the new-order alert (sound + toast) and keeping the tab open.
- Orders list: status tabs, search by number/phone/name, Show more, CSV export.
- Order detail: customer, items, totals (from the server; can't be edited), call / WhatsApp the customer.
- Moving an order: pending → confirmed → packed → shipped (courier + tracking ID) → delivered; cancel / return (stock and coupon use come back automatically, only once).
- Admin note; printing the invoice.
- What the customer sees on Track order.
- Screenshots: `05-new-order-alert`, `06-orders-list`, `07-orders-list-phone` 📱, `08-order-detail`, `09-status-change`, `10-ship-with-tracking`, `11-cancel-confirm`, `12-invoice-print`, `13-track-page-customer` 📱.

## 3. Products (manager+)
- Products list: search, filters, draft / active / archived, stock column.
- Adding a product: name, slug, prices (compare-at for a sale badge), category, gender, collections, badges, featured/bestseller, specs, description, SEO fields.
- Photos: upload (auto-compressed to WebP), order by drag, alt text, first photo = card image.
- Variants (strap / colour): stock lives on variants when a product has them.
- Stock and going out of stock; archiving instead of deleting.
- Cost price (private, manager+).
- Screenshots: `14-products-list`, `15-product-new`, `16-product-images-upload`, `17-image-reorder`, `18-variants`, `19-product-on-store` (side by side with the PDP).

## 4. Categories and collections (manager+)
- Categories (style groups; Men/Women are gender pages, not categories); tile image.
- Collections: manual pick vs rules (e.g. price under ৳2,999), banner image.
- Screenshots: `20-categories`, `21-collection-rules`, `22-collection-on-store`.

## 5. Homepage and content (manager+)
- Homepage builder: show/hide and reorder sections; hero slides (image, headline, button link); promo banners.
- Announcement bar messages.
- FAQ entries.
- Pages: About and the policies (rich-text editor).
- Reviews: approve, hide, delete, add a review by hand (with photo).
- Screenshots: `23-homepage-sections`, `24-hero-slide-edit`, `25-promo-banner`, `26-announcement`, `27-faq`, `28-page-editor`, `29-reviews-moderation`.

## 6. Customers (all roles)
- Customer list built from orders; order count and spend; blocking a phone (fake orders).
- Screenshots: `30-customers`, `31-block-phone`.

## 7. Coupons and delivery (manager+)
- Coupon types: percent, fixed, free delivery; minimum order, total uses, dates, on/off; why a used code can't be renamed.
- Delivery zones: charge, ETA, order of zones, "Outside Dhaka" asks for a district; free-delivery amount.
- Screenshots: `32-coupons-list`, `33-coupon-edit`, `34-coupon-at-checkout` 📱, `35-delivery-zones`, `36-free-delivery-amount`.

## 8. Settings (owner)
- Store status / maintenance mode (closing the shop temporarily).
- Brand (name, logos, favicon, share image), contact details (phone, WhatsApp, email, address), social links, courier names.
- SEO defaults; GA4 and Meta Pixel IDs.
- Screenshots: `37-settings-overview`, `38-maintenance-confirm`, `39-store-closed` 📱, `40-tracking-ids`.

## 9. Users and activity (owner / manager)
- Giving someone access: add the sign-in in Supabase (Authentication → Users), then grant a role in Admin → Users; changing a role; removing access.
- Activity log: who changed what and when; filter by area.
- Screenshots: `41-supabase-add-user` (Supabase dashboard), `42-users-give-access`, `43-activity-log`.

## 10. Good habits and troubleshooting
- Never share the owner login; one account per person.
- Check the store after big edits (pages cache for up to 5 minutes; hard refresh).
- Photos: size and style tips (square-ish, plain background, 4–6 per product).
- "I can't see a page" → role; "the change isn't on the store" → wait / hard refresh / product is draft; "upload failed" → file type/size; an order shows a stale status → reload.
- Who to contact for help.
- Screenshots: none (or `44-hard-refresh` icon).

## Appendix
- A. Order status meanings (table), what the customer sees for each.
- B. Error messages the admin may show and what to do.
- C. Weekly checklist: low stock, pending reviews, export orders. (Contact-form messages and newsletter sign-ups are only in Supabase → Table editor for now: `contact_messages`, `subscribers`.)
