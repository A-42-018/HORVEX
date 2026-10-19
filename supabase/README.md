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
- Errors come back as HTTP 400 with `message` set to one token (and `details` holding the product id or minimum order where useful): `empty_cart`, `too_many_items`, `invalid_item`, `variant_required`, `product_unavailable`, `out_of_stock`, `invalid_zone`, `invalid_coupon`, `coupon_min_order`, `invalid_name`, `invalid_phone`, `invalid_address`, `invalid_email`, `invalid_note`, `rate_limited`, `order_rejected`. `order_rejected` covers both blocked phones and the honeypot, so the UI should show a neutral "please call us" message.
- Anti-fake-order limits: 3 orders per phone and 10 per IP per hour. Phones are normalized like `normalizePhone()` in `src/lib/format.js`.
- Stock: product rows (or variant rows) are locked and decremented in the same transaction; the `stock >= 0` constraint is the backstop. For products with variants, the variants hold the stock.
- Order numbers come from `order_number_seq`: `HVX-10001`, `HVX-10002`, …
