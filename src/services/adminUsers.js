import { rpc } from "./adminClient";

// Admin users and the activity log (roadmap §10, B29c). All through
// security-definer functions that check the caller's role: users = owner only,
// activity = manager+. Errors carry the function's token (user_not_found, …).

export const listAdminUsers = () => rpc("admin_users");

export const addAdminUser = ({ email, name, role }) => rpc("add_admin_user", { p_email: email, p_name: name, p_role: role });

export const changeAdminRole = ({ userId, role }) => rpc("set_admin_role", { p_user: userId, p_role: role });

export const removeAdminUser = (userId) => rpc("remove_admin_user", { p_user: userId });

/**
 * One page of log entries (newest first), optionally for one entity, with the
 * actor's name. `p_offset` needs migration
 * 20261020150000_admin_list_offsets.sql, so the first page leaves it out and
 * keeps working before that migration is applied.
 */
export const listActivity = ({ entity, offset = 0, limit }) =>
  rpc("admin_activity_log", { p_entity: entity || null, p_limit: limit, ...(offset ? { p_offset: offset } : {}) });

export const listActivityEntities = () => rpc("admin_activity_entities");

