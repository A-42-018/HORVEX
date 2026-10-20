import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

/**
 * "Show more" lists: `fetchPage({ offset, limit })` returns `{ items, total? }`
 * for one page, so loading more fetches only the new rows. Without a `total`,
 * a full page means there may be more (up to `max` rows). `data` is
 * `{ items, total }` across loaded pages, deduped by `idOf`; `more()` loads the
 * next page. Keeps the old rows while a new view (new key) loads.
 */
export function usePagedList({ queryKey, fetchPage, pageSize, max = Infinity, idOf = (row) => row.id }) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage({ offset: pageParam, limit: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
      const more = last.total == null ? last.items.length >= pageSize : loaded < last.total;
      return more && loaded < max ? loaded : undefined;
    },
    select: (data) => {
      const seen = new Set();
      const items = data.pages.flatMap((page) => page.items).filter((row) => !seen.has(idOf(row)) && seen.add(idOf(row)));
      return { items, total: data.pages.at(-1)?.total ?? null };
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
  return { ...query, more: () => query.fetchNextPage({ cancelRefetch: false }) };
}
