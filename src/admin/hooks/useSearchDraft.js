import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

/**
 * Search box for a URL-backed filter: the input updates on every keystroke,
 * but `commit` (the URL, and so the queries) runs only once typing pauses.
 * Follows `committed` when it changes from elsewhere (back/forward, clear).
 * Returns [draft, setDraft].
 */
export function useSearchDraft(committed, commit, delay = 300) {
  const [draft, setDraft] = useState(committed);
  const [seen, setSeen] = useState(committed);
  const debounced = useDebouncedValue(draft, delay);

  if (committed !== seen) {
    setSeen(committed);
    if (committed !== debounced) setDraft(committed);
  }

  const latest = useRef({ committed, commit });
  useEffect(() => {
    latest.current = { committed, commit };
  });
  useEffect(() => {
    if (debounced !== latest.current.committed) latest.current.commit(debounced);
  }, [debounced]);

  return [draft, setDraft];
}
