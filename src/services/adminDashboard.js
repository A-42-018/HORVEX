import { query, queryWithCount } from "./adminClient";

// Dashboard numbers (roadmap §10), computed in the browser from the admin's own
// reads (RLS applies). Days follow Bangladesh time (UTC+6, no DST).
const TIME_ZONE = "Asia/Dhaka";
const DAY_MS = 86_400_000;
const WINDOW_DAYS = 30;
const PAGE = 1000;
const MAX_PAGES = 10;
const LATEST_LIMIT = 8;
const LOW_STOCK_LIMIT = 8;
const TOP_LIMIT = 5;
const NOT_SOLD = ["cancelled", "returned"];
const RESOLVED = ["delivered", "cancelled", "returned"];

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const labelFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, day: "numeric", month: "short" });

const dayKey = (ms) => dayFormat.format(new Date(ms));

/** Reads every row of a query, a page at a time (the API returns at most 1000). */
async function fetchAll(build) {
  const rows = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const chunk = await query((db) => build(db).range(page * PAGE, (page + 1) * PAGE - 1));
    rows.push(...chunk);
    if (chunk.length < PAGE) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

function buildSeries(orders, startMs) {
  const days = new Map();
  for (let i = 0; i < WINDOW_DAYS; i += 1) {
    const ms = startMs + i * DAY_MS;
    days.set(dayKey(ms), { day: dayKey(ms), label: labelFormat.format(new Date(ms)), revenue: 0, orders: 0 });
  }
  for (const order of orders) {
    const bucket = days.get(dayKey(new Date(order.created_at).getTime()));
    if (!bucket) continue;
    bucket.orders += 1;
    if (!NOT_SOLD.includes(order.status)) bucket.revenue += order.total;
  }
  return [...days.values()];
}

function topProducts(items) {
  const byProduct = new Map();
  for (const item of items) {
    const key = item.product_id ?? `name:${item.name_snapshot}`;
    const row = byProduct.get(key) ?? { key, productId: item.product_id, name: item.name_snapshot, qty: 0, revenue: 0 };
    row.qty += item.qty;
    row.revenue += item.qty * item.unit_price;
    byProduct.set(key, row);
  }
  return [...byProduct.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, TOP_LIMIT);
}

// A product with variants sells from variant stock; one without, from its own.
function lowStock(products) {
  const alerts = [];
  for (const product of products) {
    const threshold = product.low_stock_at;
    if (product.variants?.length) {
      for (const variant of product.variants) {
        if (variant.stock <= threshold) {
          alerts.push({ key: variant.id, productId: product.id, name: product.name, variant: variant.name, stock: variant.stock });
        }
      }
    } else if (product.stock <= threshold) {
      alerts.push({ key: product.id, productId: product.id, name: product.name, variant: null, stock: product.stock });
    }
  }
  alerts.sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));
  return { total: alerts.length, items: alerts.slice(0, LOW_STOCK_LIMIT) };
}

export async function fetchDashboard() {
  const now = Date.now();
  const todayKey = dayKey(now);
  const startMs = new Date(`${todayKey}T00:00:00+06:00`).getTime() - (WINDOW_DAYS - 1) * DAY_MS;
  const since = new Date(startMs).toISOString();

  const [orders, items, pending, latest, products] = await Promise.all([
    fetchAll((db) => db.from("orders").select("id, status, total, created_at").gte("created_at", since).order("created_at", { ascending: false }).order("id")),
    fetchAll((db) =>
      db
        .from("order_items")
        .select("product_id, name_snapshot, qty, unit_price, orders!inner(status, created_at)")
        .gte("orders.created_at", since)
        .not("orders.status", "in", `(${NOT_SOLD.join(",")})`)
        .order("id"),
    ),
    queryWithCount((db) => db.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending")),
    query((db) =>
      db.from("orders").select("id, order_number, customer_name, total, status, created_at").order("created_at", { ascending: false }).limit(LATEST_LIMIT),
    ),
    fetchAll((db) =>
      db.from("products").select("id, name, stock, low_stock_at, variants:product_variants(id, name, stock)").eq("status", "active").order("id"),
    ),
  ]);

  const series = buildSeries(orders.rows, startMs);
  const today = series[series.length - 1];
  const resolved = orders.rows.filter((order) => RESOLVED.includes(order.status));

  return {
    generatedAt: now,
    today: { orders: today.orders, revenue: today.revenue },
    pending: pending.count ?? 0,
    deliveredRate: {
      delivered: resolved.filter((order) => order.status === "delivered").length,
      resolved: resolved.length,
    },
    totals: {
      orders: orders.rows.length,
      revenue: series.reduce((sum, day) => sum + day.revenue, 0),
    },
    series,
    topProducts: topProducts(items.rows),
    lowStock: lowStock(products.rows),
    latest,
    truncated: orders.truncated || items.truncated || products.truncated,
  };
}
