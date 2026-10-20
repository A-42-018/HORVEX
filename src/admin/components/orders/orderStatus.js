// Pure rules for moving an order through its lifecycle (roadmap §10, B25b).
// The database accepts any status value; these rules keep the UI sensible:
// forward one step, cancel before it ships, return after it ships.

export const PIPELINE = ["pending", "confirmed", "packed", "shipped", "delivered"];

const NEXT = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

/** Statuses an order may move to from `status`. */
export const nextStatuses = (status) => NEXT[status] ?? [];

/** True when no further change is offered. */
export const isClosed = (status) => nextStatuses(status).length === 0;

/** Cancelling or returning needs a confirm step. */
export const needsConfirm = (status) => status === "cancelled" || status === "returned";

/**
 * Steps for the progress strip: each pipeline step is done / current / upcoming.
 * A cancelled or returned order keeps the steps it reached (from history) and
 * ends on that state.
 */
export function pipelineSteps(status, history = []) {
  const reached = new Set(history.map((h) => h.to_status));
  const stopped = status === "cancelled" || status === "returned";
  const index = PIPELINE.indexOf(status);
  const steps = PIPELINE.map((key, i) => ({
    key,
    state: stopped ? (reached.has(key) ? "done" : "skipped") : i < index ? "done" : i === index ? "current" : "upcoming",
  })).filter((step) => step.state !== "skipped");
  if (stopped) steps.push({ key: status, state: "stopped" });
  return steps;
}

/** Who made a history entry: you, a teammate, or the system (no actor). */
export function actorOf(entry, userId) {
  if (!entry.changed_by) return "system";
  return entry.changed_by === userId ? "you" : "team";
}
