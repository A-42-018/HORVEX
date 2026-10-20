import { useQuery } from "@tanstack/react-query";
import { ACTIVITY_PAGE_SIZE, MAX_ACTIVITY } from "../components/activity/activityRules";
import { listActivity, listActivityEntities } from "../../services/adminUsers";
import { queryKeys } from "../../services/queryKeys";
import { usePagedList } from "./usePagedList";

/** Log entries, optionally for one entity, a page at a time (up to MAX_ACTIVITY rows). */
export function useActivity({ entity }) {
  const filters = { entity: entity || "" };
  return usePagedList({
    queryKey: queryKeys.activity.adminList(filters),
    fetchPage: async (page) => ({ items: await listActivity({ ...filters, ...page }) }),
    pageSize: ACTIVITY_PAGE_SIZE,
    max: MAX_ACTIVITY,
  });
}

/** Areas that have log entries, for the filter. */
export function useActivityEntities() {
  return useQuery({ queryKey: queryKeys.activity.adminEntities(), queryFn: listActivityEntities, staleTime: 60_000 });
}
