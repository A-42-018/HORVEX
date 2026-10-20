// Pure rules for the printable invoice / packing slip (roadmap §10, B26a).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isOrderId = (value) => UUID.test(value ?? "");

/** `?doc=` value → document kind. Anything unknown is the invoice. */
export const readDoc = (value) => (value === "packing" ? "packing" : "invoice");

/** Cancelled and returned orders must not be shipped. */
export const isVoidStatus = (status) => status === "cancelled" || status === "returned";

/** Cash on delivery is still owed only while the order is open. */
export const isCollectable = (status) => !isVoidStatus(status) && status !== "delivered";

export const amountToCollect = (order) => (isCollectable(order.status) ? order.total : 0);

export const lineTotal = (item) => item.unit_price * item.qty;

export const unitCount = (items) => items.reduce((sum, item) => sum + item.qty, 0);

/** Letterhead lines from the site settings: address, phone, email (blanks dropped). */
export const contactLines = (settings) =>
  [settings?.address, settings?.contact_phone, settings?.contact_email]
    .map((line) => (typeof line === "string" ? line.trim() : ""))
    .filter(Boolean);
