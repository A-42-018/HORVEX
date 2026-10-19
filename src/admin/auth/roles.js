// Roadmap §10: owner = everything · manager = all but users/settings · staff = orders only.
// RLS enforces the same split; these checks only decide what the UI offers.
const RANK = { staff: 1, manager: 2, owner: 3 };

export const hasRole = (role, minRole = "staff") => (RANK[role] ?? 0) >= RANK[minRole];
