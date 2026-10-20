# Supabase

- `migrations/`: schema, RLS and storage, applied in filename order. Never edit a migration that has already been applied; add a new one.
- `tests/`: SQL check scripts. Each one cleans up after itself and ends with a single "passed" row.
- `seed.sql`: starter catalog and content. Run once, after the migrations, on an empty catalog (it refuses to run otherwise).

## Applying migrations (no CLI needed)
1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste one migration file, click **Run**, and wait for "Success". Repeat for each file, in filename order.
3. Paste the matching `tests/*.sql` script and run it. It should return one row ending in "passed".
4. On a fresh project, paste `seed.sql` and run it once.

## Access model (Phase A3)
- **anon / signed-in non-admins**: read active products, visible categories and collections, approved reviews, active zones and published content. They may insert `subscribers` and `contact_messages` (no read-back). Orders, order items, customers, `product_costs`, coupons, blocked phones, admin profiles and the activity log are not granted to anon at all.
- **Admins** are users with an `admin_profiles` row. `is_admin()` covers any role, `is_manager()` covers owner and manager, and `is_owner()` covers owner only.
  - staff: orders, customers, blocked phones, and reading the catalog (including drafts)
  - manager: everything except settings and admin users
  - owner: everything
- **Orders have no INSERT policy.** They are created only by the security-definer `place_order()` (Phase A4).
- `cost_price` lives in `product_costs` (manager+), never on `products`.
- Storage buckets `product-images`, `site-media` and `review-photos` are public by URL but can't be listed by anon. Only managers and owners can upload or delete.

## Order engine (Phase A4)
Three RPCs are callable by anyone (`supabase.rpc(name, args)`); everything else in the migration is internal.

| RPC | Args | Returns |
|---|---|---|
| `quote_order` | `p_items`, `p_zone_id`, `p_coupon_code?` | `{ lines[], subtotal, discount, coupon_code, coupon_type, zone_id, zone_name, eta_text, delivery_charge, free_delivery_threshold, total }`. Read-only; each line carries `stock` |
| `place_order` | `p_items`, `p_zone_id`, `p_customer_name`, `p_phone`, `p_address`, `p_district?`, `p_email?`, `p_note?`, `p_coupon_code?`, `p_website?` (honeypot, leave empty) | `{ order_id, order_number, created_at, customer_name, lines[], subtotal, discount, coupon_code, delivery_charge, zone_name, eta_text, total }` |
| `track_order` | `p_phone`, `p_order_number` | `{ order_number, status, placed_at, subtotal, discount, delivery_charge, total, zone_name, eta_text, courier, tracking_id, items[], history[{status, at}] }` or `null` |

- `p_items` is `[{ product_id, variant_id?, qty }]`. Any price the client sends is ignored. Duplicate lines are merged; at most 20 lines and 10 per line. A product that has variants needs a `variant_id`.
- Totals: `subtotal − discount + delivery_charge`. Delivery is free with a `free_shipping` coupon or when `subtotal − discount ≥ site_settings.free_delivery_threshold`.
- Errors come back as HTTP 400 with `message` set to one token (and `details` holding the product id or minimum order where useful): `empty_cart`, `too_many_items`, `invalid_item`, `variant_required`, `product_unavailable`, `out_of_stock`, `invalid_zone`, `invalid_coupon`, `coupon_min_order`, `invalid_name`, `invalid_phone`, `invalid_address`, `invalid_email`, `invalid_note`, `rate_limited`, `order_rejected`, `maintenance`. Since C5, `invalid_coupon` can also arrive as a normal result `{ error }` (see below), and `track_order` can raise `rate_limited`. `order_rejected` covers both blocked phones and the honeypot, so the UI should show a neutral "please call us" message. `maintenance` means `site_settings.maintenance_mode` is on (B29b); the storefront shows a closed notice and `place_order` refuses every order.
- Manager-level writes on `site_settings` (the table itself is owner-only): `set_announcements(jsonb)` (≤ 8 messages, text 1–90, optional link ≤ 200) and `set_free_delivery_threshold(integer)` (null = off), both `security definer`, manager+ only, `authenticated` execute.
- Anti-fake-order limits: 3 orders per phone and 10 per IP per hour. Phones are normalized like `normalizePhone()` in `src/lib/format.js`.
- Stock: product rows (or variant rows) are locked and decremented in the same transaction; the `stock >= 0` constraint is the backstop. For products with variants, the variants hold the stock.
- Cancel / return (migration `20261020140000_restock_on_cancel.sql`, test `tests/restock_on_cancel_check.sql`): when an order moves into `cancelled` or `returned` from any other status, the `orders_restock_on_cancel` trigger adds each item's qty back to its variant (or to the product when the line had no variant) and gives back one coupon use (`used` never goes below 0). Lines whose product/variant has since been deleted are skipped. Moving between cancelled and returned, or out of them, doesn't touch stock again.
- `admin_activity_log(p_entity, p_limit, p_offset)`: migration `20261020150000_admin_list_offsets.sql` adds the offset so the activity viewer loads one page at a time (the app leaves `p_offset` out on page 1, so the first page works before it's applied).
- Order numbers come from `order_number_seq`: `HVX-10001`, `HVX-10002`, …

## Security hardening (Phase C5)
Migration `20261021100000_c5_security.sql`, test `tests/c5_security_check.sql` (abuse cases on `place_order`, privileges, limits; rolls back).
- **Orders**: the API may update only `status`, `courier`, `tracking_id` and `admin_note` (column grants). Totals, coupon, customer details and the new `stock_restored` flag can't be changed from the browser.
- **Restock once**: `stock_restored` is set the first time an order moves into cancelled/returned; moving it out and back in doesn't give stock or the coupon use back again.
- **Limits** (rows in the internal `request_attempts` table, not reachable through the API; rows older than a day are pruned):
  - `track_order`: 20 misses per phone per day and 30 misses per IP per hour, then `rate_limited`. Lookups that find the order don't count.
  - Coupons: with a known IP, an unknown code from `quote_order` or `place_order` returns `{ "error": "invalid_coupon" }` with HTTP 200 instead of raising (a raised error would roll back the counter); `services/orders.js` turns it into the usual `invalid_coupon` error. After 10 misses per IP per hour every code is refused as `invalid_coupon`.
  - `contact_messages` and `subscribers` inserts: 5 per IP per 10 minutes each, then `rate_limited`.
- `place_order` is now a thin wrapper around `place_order_checked` (the B29b body, internal). A later migration that changes the order logic should replace `place_order_checked`, not `place_order`, or the coupon limit is lost.
