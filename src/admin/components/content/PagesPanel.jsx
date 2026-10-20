import { useState } from "react";
import { ExternalLink, Pencil } from "lucide-react";
import { Badge, Button, Card, Skeleton } from "../../../components/common";
import { formatDateTime } from "../../../lib/format";
import { strings } from "../../../lib/strings";
import { usePageRows } from "../../hooks/useContentAdmin";
import PageModal from "./PageModal";
import { pagePath } from "./pageForm";

const t = strings.admin.content.pages;
const common = strings.admin.homeContent.common;

export default function PagesPanel() {
  const { data: rows, isPending, isError, refetch } = usePageRows();
  const [editing, setEditing] = useState(undefined); // undefined = closed, row = edit
  const [modalKey, setModalKey] = useState(0);
  const [notice, setNotice] = useState("");

  const open = (row) => {
    setModalKey((n) => n + 1);
    setEditing(row);
  };

  return (
    <div className="flex flex-col gap-6">
      {rows && <p className="text-small text-muted">{t.count(rows.length, rows.filter((row) => row.is_published).length)}</p>}
      <p className="max-w-prose text-small text-muted">{t.intro}</p>

      <p role="status" className="sr-only">
        {notice}
      </p>
      {notice && (
        <p aria-hidden="true" className="text-small text-positive">
          {notice}
        </p>
      )}

      {isPending && (
        <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {isError && !rows && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {common.retry}
          </Button>
        </div>
      )}

      {rows &&
        (rows.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-body text-fg">{t.empty.none}</p>
            <p className="text-small text-muted">{t.empty.noneHint}</p>
          </Card>
        ) : (
          <Card as="section" aria-label={t.title} className="overflow-hidden">
            <ul className="divide-y divide-line">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-body font-semibold text-fg">{row.title}</p>
                    <p className="text-small text-muted">
                      {pagePath(row.slug)}
                      {row.updated_at && ` · ${t.updated(formatDateTime(row.updated_at))}`}
                    </p>
                    {!row.is_published && <Badge variant="neutral" className="w-fit">{t.unpublished}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    {row.is_published && (
                      <Button as="a" href={pagePath(row.slug)} target="_blank" rel="noreferrer" variant="ghost" size="sm" className="gap-2" aria-label={t.viewLabel(row.title)}>
                        <ExternalLink aria-hidden="true" size={16} strokeWidth={1.5} />
                        {t.view}
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" className="gap-2" aria-label={t.editLabel(row.title)} onClick={() => open(row)}>
                      <Pencil aria-hidden="true" size={16} strokeWidth={1.5} />
                      {t.edit}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}

      <PageModal
        key={modalKey}
        open={editing !== undefined}
        page={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSaved={(message) => {
          setEditing(undefined);
          setNotice(message);
        }}
      />
    </div>
  );
}
