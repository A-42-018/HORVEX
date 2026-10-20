import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Card, Skeleton } from "../../../components/common";
import { strings } from "../../strings";
import ContentRows from "./ContentRows";
import { dragRow, moveRow } from "./contentRules";

const common = strings.admin.homeContent.common;

const failureFor = (error, fallback) =>
  error?.code === "42501" || error?.code === "PGRST116" ? common.messages.forbidden : fallback;

/**
 * Shared list screen for hero slides and promo banners.
 * `config`: { copy, hooks, nameOf, thumb? (omit for text-only rows), activeField? (default "is_active"), info, summary(rows), guardOn?(rows,row) → message|null,
 *             canAdd?(rows) → bool, addNote?, Modal, modalProp }
 */
export default function ContentPanel({ config }) {
  const { copy, hooks, nameOf, thumb, info, summary, guardOn, canAdd, Modal, modalProp, activeField = "is_active" } = config;
  const { data: rows, isPending, isError, refetch } = hooks.useRows();
  const crud = hooks.useCrud();
  const toggle = hooks.useToggle();
  const reorder = hooks.useReorder();
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, row = edit
  const [modalKey, setModalKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const busy = reorder.isPending || crud.remove.isPending;
  const addBlocked = rows && canAdd ? !canAdd(rows) : false;

  const open = (row) => {
    setModalKey((n) => n + 1);
    setEditing(row);
  };

  const onToggle = (row, value) => {
    setFailure("");
    setNotice("");
    const blocked = value && guardOn ? guardOn(rows, row) : null;
    if (blocked) return setFailure(blocked);
    return toggle.mutate(
      { id: row.id, patch: { [activeField]: value } },
      { onError: (error) => setFailure(failureFor(error, copy.messages.toggleFailed(nameOf(row)))) },
    );
  };

  const applyOrder = (ordered, id) => {
    if (ordered === rows) return;
    setFailure("");
    setNotice(copy.moved(nameOf(rows.find((row) => row.id === id)), ordered.findIndex((row) => row.id === id) + 1, rows.length));
    reorder.mutate(ordered, {
      onError: (error) => {
        setNotice("");
        setFailure(failureFor(error, copy.messages.reorderFailed));
      },
    });
  };

  const onRemove = (row) => {
    setFailure("");
    crud.remove.mutate(row, {
      onSuccess: () => setNotice(copy.messages.removed(nameOf(row))),
      onError: (error) => setFailure(failureFor(error, copy.messages.removeFailed)),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {rows ? <p className="text-small text-muted">{summary(rows)}</p> : <span />}
        <Button size="sm" className="gap-2" disabled={addBlocked} onClick={() => open(null)}>
          <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
          {copy.newItem}
        </Button>
      </div>
      <p className="max-w-prose text-small text-muted">{copy.intro}</p>
      {addBlocked && copy.capNote && <p className="text-small text-muted">{copy.capNote}</p>}

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
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {isError && !rows && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{copy.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {common.retry}
          </Button>
        </div>
      )}

      {rows &&
        (rows.length === 0 ? (
          <Card className="admin-empty flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-body text-fg">{copy.empty.none}</p>
            <p className="text-small text-muted">{copy.empty.noneHint}</p>
          </Card>
        ) : (
          <Card as="section" aria-label={copy.title} className="overflow-hidden">
            <ContentRows
              rows={rows}
              busy={busy}
              copy={copy}
              nameOf={nameOf}
              thumb={thumb}
              activeField={activeField}
              info={(row) => info(row, rows)}
              onMove={(id, delta) => applyOrder(moveRow(rows, id, delta), id)}
              onDrag={(activeId, overId) => applyOrder(dragRow(rows, activeId, overId), activeId)}
              onToggle={onToggle}
              onEdit={open}
              onRemove={onRemove}
            />
          </Card>
        ))}

      <Modal
        key={modalKey}
        open={editing !== undefined}
        {...{ [modalProp]: editing ?? null }}
        rows={rows ?? []}
        onClose={() => setEditing(undefined)}
        onSaved={(message) => {
          setEditing(undefined);
          setFailure("");
          setNotice(message);
        }}
      />
    </div>
  );
}
