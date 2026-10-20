import { useState } from "react";
import { useSearchParams } from "react-router";
import { Button, Card, Select, Skeleton } from "../../components/common";
import { formatDateTime } from "../../lib/format";
import { strings } from "../../lib/strings";
import { ACTIVITY_PAGE_SIZE, diffKeys, diffText, mayHaveMore, targetOf } from "../components/activity/activityRules";
import { useActivity, useActivityEntities } from "../hooks/useActivityAdmin";

const t = strings.admin.activity;
const verb = (action) => t.actions[action] ?? action;
const who = (entry) => entry.actor_name ?? (entry.actor ? t.unknownActor : t.system);

function Details({ entry }) {
  const keys = diffKeys(entry.diff);
  if (!keys) return <span className="text-small text-muted">—</span>;
  return (
    <details className="text-small">
      <summary className="cursor-pointer rounded-control text-muted hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus">
        {keys}
      </summary>
      <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-control bg-raised p-3 text-small text-fg">
        {diffText(entry.diff)}
      </pre>
    </details>
  );
}

function Activity() {
  const [params, setParams] = useSearchParams();
  const entity = params.get("area") ?? "";
  const [limit, setLimit] = useState(ACTIVITY_PAGE_SIZE);
  const { data, isPending, isError, isFetching, refetch } = useActivity({ entity, limit });
  const entities = useActivityEntities();

  const setEntity = (value) => {
    setParams(value ? { area: value } : {}, { replace: true });
    setLimit(ACTIVITY_PAGE_SIZE);
  };
  const items = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | HORVEX Admin`}</title>
      <div>
        <h1 className="text-h3 text-fg">{t.title}</h1>
        <p className="text-small text-muted">{t.intro}</p>
      </div>

      <div role="search" aria-label={t.filters.label} className="grid gap-3 sm:max-w-xs">
        <Select
          label={t.filters.entity}
          value={entity}
          onChange={(event) => setEntity(event.target.value)}
          options={[{ value: "", label: t.filters.all }, ...(entities.data ?? []).map((name) => ({ value: name, label: name }))]}
        />
      </div>

      {isPending && (
        <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}

      {isError && !data && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      )}

      {data && (
        <>
          <p role="status" className="text-small text-muted">
            {isFetching ? t.filters.updating : t.filters.showing(items.length)}
          </p>
          {items.length === 0 ? (
            <Card className="px-6 py-12 text-center">
              <p className="text-body text-fg">{entity ? t.emptyFiltered : t.empty}</p>
            </Card>
          ) : (
            <Card as="section" aria-label={t.title} className="overflow-hidden">
              <ul className="divide-y divide-line">
                {items.map((entry) => (
                  <li key={entry.id} className="flex flex-col gap-1 px-4 py-3 sm:grid sm:grid-cols-[11rem_1fr_minmax(0,1fr)] sm:items-start sm:gap-4">
                    <time dateTime={entry.created_at} className="text-small tabular-nums text-muted">
                      {formatDateTime(entry.created_at)}
                    </time>
                    <p className="text-small text-fg">
                      <span className="font-semibold">{who(entry)}</span> {verb(entry.action)} <span className="text-muted">{targetOf(entry)}</span>
                    </p>
                    <Details entry={entry} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {mayHaveMore(items.length, limit) && (
            <Button variant="secondary" size="sm" className="self-center" onClick={() => setLimit((n) => n + ACTIVITY_PAGE_SIZE)}>
              {t.filters.more}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export default Activity;
