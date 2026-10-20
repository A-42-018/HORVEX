import { useQuery } from "@tanstack/react-query";
import { addAdminUser, changeAdminRole, listAdminUsers, removeAdminUser } from "../../services/adminUsers";
import { queryKeys } from "../../services/queryKeys";
import { useAdminMutation } from "./useAdminMutation";

const INVALIDATE = [queryKeys.users.all];

/** Everyone with admin access (owner only). */
export function useAdminUsers() {
  return useQuery({ queryKey: queryKeys.users.adminList(), queryFn: listAdminUsers, staleTime: 0 });
}

export const useAddAdminUser = () =>
  useAdminMutation({
    mutationFn: addAdminUser,
    invalidate: INVALIDATE,
    activity: (userId, { email, role }) => ({ action: "create", entity: "admin_users", entityId: userId, diff: { email, role } }),
  });

export const useChangeAdminRole = () =>
  useAdminMutation({
    mutationFn: changeAdminRole,
    invalidate: INVALIDATE,
    activity: (result, { userId, role }) => ({ action: "update", entity: "admin_users", entityId: userId, diff: { role } }),
  });

export const useRemoveAdminUser = () =>
  useAdminMutation({
    mutationFn: removeAdminUser,
    invalidate: INVALIDATE,
    activity: (result, userId) => ({ action: "delete", entity: "admin_users", entityId: userId }),
  });
