import { rpc } from "./supabase";

// Thin wrappers over the A4 order engine (supabase/README.md → "Order engine").
// The server re-prices everything; the client only sends ids and quantities.
// Failures throw a ServiceError whose `code` is the engine's token
// (out_of_stock, invalid_coupon, rate_limited, …); the UI maps it to copy.

/** Cart lines → the engine's `p_items` shape. */
export const toOrderItems = (lines) =>
  lines.map(({ productId, variantId, qty }) => ({ product_id: productId, variant_id: variantId ?? null, qty }));

/** Server-computed totals for the checkout summary. Read-only. */
export function quoteOrder({ lines, zoneId, couponCode }) {
  return rpc("quote_order", {
    p_items: toOrderItems(lines),
    p_zone_id: zoneId,
    p_coupon_code: couponCode || null,
  });
}

/** Creates the order. `website` is the honeypot field's value (empty for real customers). */
export function placeOrder({ lines, zoneId, couponCode, name, phone, address, district, email, note, website }) {
  return rpc("place_order", {
    p_items: toOrderItems(lines),
    p_zone_id: zoneId,
    p_customer_name: name,
    p_phone: phone,
    p_address: address,
    p_district: district || null,
    p_email: email || null,
    p_note: note || null,
    p_coupon_code: couponCode || null,
    p_website: website || null,
  });
}

/** Limited order status for the track page, or null if phone + number don't match. */
export function trackOrder({ phone, orderNumber }) {
  return rpc("track_order", { p_phone: phone, p_order_number: orderNumber });
}
