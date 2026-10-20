import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listActivity, listActivityEntities } from "../../services/adminUsers";
import { queryKeys } from "../../services/queryKeys";

/** Latest `limit` log entries, optionally for one entity. Keeps old rows while a new view loads. */
export function useActivity({ entity, limit }) {
  const key = { entity: entity || "", limit };
  return useQuery({
    queryKey: queryKeys.activity.adminList(key),
    queryFn: () => listActivity({ entity, limit }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

/** Areas that have log entries, for the filter. */
export function useActivityEntities() {
  return useQuery({ queryKey: queryKeys.activity.adminEntities(), queryFn: listActivityEntities, staleTime: 60_000 });
}
