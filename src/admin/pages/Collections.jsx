import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button, Card, Skeleton } from "../../components/common";
import { strings } from "../strings";
import { moveRow } from "../components/categories/categoryForm";
import CollectionModal from "../components/collections/CollectionModal";
import CollectionList from "../components/collections/CollectionRows";
import { useCollectionRows, useReorderCollections, useRemoveCollection, useRuleCategories, useToggleCollection } from "../hooks/useCollectionAdmin";

const t = strings.admin.collections;

const failureFor = (error, fallback) => (error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : fallback);

function Collections() {
  const { data: rows, isPending, isError, refetch } = useCollectionRows();
  const categories = useRuleCategories();
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, row = edit
  const [modalKey, setModalKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");

  const toggle = useToggleCollection();
  const reorder = useReorderCollections();
  const remove = useRemoveCollection();
  const busy = reorder.isPending || remove.isPending;
  const categoryNames = useMemo(() => new Map((categories.data ?? []).map((c) => [c.slug, c.name])), [categories.data]);

  const open = (collection) => {
    setModalKey((n) => n + 1);
    setEditing(collection);
  };

  const onToggle = (collection, value) => {
    setFailure("");
    setNotice("");
    toggle.mutate(
      { id: collection.id, patch: { is_visible: value } },
      { onError: (error) => setFailure(failureFor(error, t.messages.toggleFailed(collection.title))) },
    );
  };

  const onMove = (id, delta) => {
    const ordered = moveRow(rows, id, delta);
    if (ordered === rows) return;
    const title = rows.find((row) => row.id === id).title;
    setFailure("");
    setNotice(t.moved(title, ordered.findIndex((row) => row.id === id) + 1, rows.length));
    reorder.mutate(ordered, { onError: () => { setNotice(""); setFailure(t.messages.reorderFailed); } });
  };

  const onRemove = (collection) => {
    setFailure("");
    remove.mutate(collection, {
      onSuccess: () => setNotice(t.messages.removed(collection.title)),
      onError: (error) => setFailure(failureFor(error, t.messages.removeFailed)),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | WRISTORY Admin`}</title>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h3 text-fg">{t.title}</h1>
          {rows && <p className="text-small text-muted">{t.count(rows.length)}</p>}
        </div>
        <Button size="sm" className="gap-2" onClick={() => open(null)}>
          <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
          {t.newCollection}
        </Button>
      </div>
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
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
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
            <CollectionList rows={rows} categoryNames={categoryNames} busy={busy} onMove={onMove} onToggle={onToggle} onEdit={open} onRemove={onRemove} />
          </Card>
        ))}

      <CollectionModal
        key={modalKey}
        open={editing !== undefined}
        collection={editing ?? null}
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

export default Collections;
