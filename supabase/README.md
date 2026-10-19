# Supabase

- `migrations/`: schema, RLS and storage, applied in filename order. Never edit a migration that has already been applied; add a new one.
- `tests/`: SQL check scripts. Each one cleans up after itself and ends with a single "passed" row.

## Applying migrations (no CLI needed)
1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste one migration file, click **Run**, and wait for "Success". Repeat for each file, in filename order.
3. Paste the matching `tests/*.sql` script and run it. It should return one row ending in "passed".

## Access model (Phase A3)
- **anon / signed-in non-admins**: read active products, visible categories and collections, approved reviews, active zones and published content. They may insert `subscribers` and `contact_messages` (no read-back). Orders, order items, customers, `product_costs`, coupons, blocked phones, admin profiles and the activity log are not granted to anon at all.
- **Admins** are users with an `admin_profiles` row. `is_admin()` covers any role, `is_manager()` covers owner and manager, and `is_owner()` covers owner only.
  - staff: orders, customers, blocked phones, and reading the catalog (including drafts)
  - manager: everything except settings and admin users
  - owner: everything
- **Orders have no INSERT policy.** They are created only by the security-definer `place_order()` (Phase A4).
- `cost_price` lives in `product_costs` (manager+), never on `products`.
- Storage buckets `product-images`, `site-media` and `review-photos` are public by URL but can't be listed by anon. Only managers and owners can upload or delete.
