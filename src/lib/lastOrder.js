// The order response from place_order, kept for this tab only so the success
// page survives a refresh. Orders can't be read back from the database by
// guests, so this is the one copy; track_order covers later lookups.
const KEY = "wristory-last-order";

export function saveLastOrder(order) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // Private mode or full storage: the success page still gets the order via router state.
  }
}

/** Returns the saved order only if it is the one the URL asks for. */
export function loadLastOrder(orderId) {
  try {
    const order = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    return order && String(order.order_id) === String(orderId) ? order : null;
  } catch {
    return null;
  }
}
