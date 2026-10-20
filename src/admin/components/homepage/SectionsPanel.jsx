import { useState } from "react";
import { Button, Card, Skeleton } from "../../../components/common";
import { strings } from "../../strings";
import SectionList from "./SectionRows";
import SectionTextModal from "./SectionTextModal";
import { dragRow, isLastVisible, metaFor, moveRow } from "./homeSections";
import { useHomeSectionRows, useReorderHomeSections, useToggleHomeSection } from "../../hooks/useHomeSectionAdmin";

const t = strings.admin.homepage;

const failureFor = (error, fallback) => (error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : fallback);

function SectionsPanel() {
  const { data: rows, isPending, isError, refetch } = useHomeSectionRows();
  const toggle = useToggleHomeSection();
  const reorder = useReorderHomeSections();
  const [editing, setEditing] = useState(null);
  const [modalKey, setModalKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const busy = reorder.isPending;

  const applyOrder = (ordered, movedId) => {
    if (ordered === rows) return;
    const { label } = metaFor(rows.find((row) => row.id === movedId).key);
    setFailure("");
    setNotice(t.moved(label, ordered.findIndex((row) => row.id === movedId) + 1, rows.length));
    reorder.mutate(ordered, {
      onError: (error) => {
        setNotice("");
        setFailure(failureFor(error, t.messages.reorderFailed));
      },
    });
  };

  const onToggle = (row, value) => {
    const { label } = metaFor(row.key);
    setFailure("");
    setNotice("");
    if (!value && isLastVisible(rows, row)) return setFailure(t.messages.lastVisible);
    toggle.mutate(
      { id: row.id, patch: { is_visible: value } },
      { onError: (error) => setFailure(failureFor(error, t.messages.toggleFailed(label))) },
    );
  };

  const hiddenCount = rows?.filter((row) => !row.is_visible).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {rows && <p className="text-small text-muted">{t.count(rows.length, hiddenCount)}</p>}
      <p className="max-w-prose text-small text-muted">{t.intro}</p>

      <p role="status" className="sr-only">
        {notice}
      </p>
      {notice && (
        <p aria-hidden="true" className="text-small text-positive">
          {notice}
        </p>
      )}
      {failure && (
        <p role="alert" className="text-small text-danger">
          {failure}
        </p>
      )}

      {isPending && (
        <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {isError && !rows && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t.retry}
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
            <SectionList
              rows={rows}
              busy={busy}
              onMove={(id, delta) => applyOrder(moveRow(rows, id, delta), id)}
              onDrag={(activeId, overId) => applyOrder(dragRow(rows, activeId, overId), activeId)}
              onToggle={onToggle}
              onEdit={(row) => {
                setModalKey((n) => n + 1);
                setEditing(row);
              }}
            />
          </Card>
        ))}

      <SectionTextModal
        key={modalKey}
        open={editing !== null}
        section={editing}
        onClose={() => setEditing(null)}
        onSaved={(message) => {
          setEditing(null);
          setFailure("");
          setNotice(message);
        }}
      />
    </div>
  );
}

export default SectionsPanel;
