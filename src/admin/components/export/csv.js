// Pure CSV helpers for the admin exports (roadmap §10, B26b).

const NEEDS_QUOTES = /[",\r\n]/;
// A leading = + - @ (or tab / CR) makes Excel and Sheets run the cell as a formula.
const FORMULA_START = /^[=+\-@\t\r]/;
// Phones ("+8801712345678") and plain numbers start with + or - but are safe data.
const NUMBER_LIKE = /^[+-]?\d[\d\s.-]*$/;

/** One cell as CSV text. Null / undefined → empty; formula-looking text gets a leading apostrophe. */
export function csvCell(value) {
  if (value == null) return "";
  let text = String(value);
  if (FORMULA_START.test(text) && !NUMBER_LIKE.test(text)) text = `'${text}`;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * columns: [{ header, value: (row) => any }]. Returns CSV text with CRLF line
 * ends and a leading BOM, so Excel reads the UTF-8 (Bangla names) correctly.
 */
export function toCsv(columns, rows) {
  const lines = [columns.map((c) => csvCell(c.header)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvCell(c.value(row))).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/** Dhaka-time stamp "2026-10-20 14:05" for a timestamptz string. */
export function dhakaStamp(iso) {
  if (!iso) return "";
  const date = new Date(new Date(iso).getTime() + 6 * 3_600_000);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16).replace("T", " ");
}

/** "wristory-orders-2026-10-20.csv" (the day is Dhaka's). */
export const exportFileName = (kind, now = new Date()) => `wristory-${kind}-${dhakaStamp(now.toISOString()).slice(0, 10)}.csv`;

/** Saves CSV text as a download (browser only). */
export function downloadCsv(fileName, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const ORDER_COLUMNS = [
  { header: "Order", value: (o) => o.order_number },
  { header: "Placed (Dhaka)", value: (o) => dhakaStamp(o.created_at) },
  { header: "Status", value: (o) => o.status },
  { header: "Customer", value: (o) => o.customer_name },
  { header: "Phone", value: (o) => o.phone },
  { header: "Email", value: (o) => o.email },
  { header: "District", value: (o) => o.district },
  { header: "Address", value: (o) => o.address },
  {
    header: "Items",
    value: (o) =>
      (o.items ?? [])
        .map((i) => `${i.name_snapshot}${i.variant_snapshot ? ` (${i.variant_snapshot})` : ""} x${i.qty}`)
        .join("; "),
  },
  { header: "Units", value: (o) => (o.items ?? []).reduce((sum, i) => sum + i.qty, 0) },
  { header: "Subtotal", value: (o) => o.subtotal },
  { header: "Discount", value: (o) => o.discount },
  { header: "Coupon", value: (o) => o.coupon_code },
  { header: "Delivery", value: (o) => o.delivery_charge },
  { header: "Total", value: (o) => o.total },
  { header: "Payment", value: (o) => o.payment_method },
  { header: "Courier", value: (o) => o.courier },
  { header: "Tracking ID", value: (o) => o.tracking_id },
  { header: "Customer note", value: (o) => o.customer_note },
];

export const CUSTOMER_COLUMNS = [
  { header: "Name", value: (c) => c.name },
  { header: "Phone", value: (c) => c.phone },
  { header: "Email", value: (c) => c.email },
  { header: "District", value: (c) => c.district },
  { header: "Orders", value: (c) => c.orders_count },
  { header: "Delivered", value: (c) => c.delivered_count },
  { header: "Cancelled or returned", value: (c) => c.cancelled_count },
  { header: "Total spent (delivered)", value: (c) => c.total_spent },
  { header: "First order (Dhaka)", value: (c) => dhakaStamp(c.first_order_at) },
  { header: "Last order (Dhaka)", value: (c) => dhakaStamp(c.last_order_at) },
  { header: "Blocked", value: (c) => (c.is_blocked ? "yes" : "no") },
];
