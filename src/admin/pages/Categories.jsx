import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Card, Skeleton } from "../../components/common";
import { strings } from "../../lib/strings";
import CategoryModal from "../components/categories/CategoryModal";
import CategoryList from "../components/categories/CategoryRows";
import { moveRow } from "../components/categories/categoryForm";
import { useCategoryCrud, useCategoryRows, useReorderCategories, useToggleCategory } from "../hooks/useCategoryAdmin";

const t = strings.admin.categories;

const failureFor = (error, fallback) => (error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : fallback);

function Categories() {
  const { data: rows, isPending, isError, refetch } = useCategoryRows();
  const crud = useCategoryCrud();
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, row = edit
  const [modalKey, setModalKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");

  const toggle = useToggleCategory({ onFailed: () => undefined });
  const reorder = useReorderCategories();
  const busy = reorder.isPending || crud.remove.isPending;

  const open = (category) => {
    setModalKey((n) => n + 1);
    setEditing(category);
  };

  const onToggle = (category, value) => {
    setFailure("");
    setNotice("");
    toggle.mutate(
      { id: category.id, patch: { is_visible: value } },
      { onError: (error) => setFailure(failureFor(error, t.messages.toggleFailed(category.name))) },
    );
  };

  const onMove = (id, delta) => {
    const ordered = moveRow(rows, id, delta);
    if (ordered === rows) return;
    const name = rows.find((row) => row.id === id).name;
    setFailure("");
    setNotice(t.moved(name, ordered.findIndex((row) => row.id === id) + 1, rows.length));
    reorder.mutate(ordered, { onError: () => { setNotice(""); setFailure(t.messages.reorderFailed); } });
  };

  const onRemove = (category) => {
    setFailure("");
    crud.remove.mutate(category, {
      onSuccess: () => setNotice(t.messages.removed(category.name)),
      onError: (error) => setFailure(failureFor(error, t.messages.removeFailed)),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | HORVEX Admin`}</title>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h3 text-fg">{t.title}</h1>
          {rows && <p className="text-small text-muted">{t.count(rows.length)}</p>}
        </div>
        <Button size="sm" className="gap-2" onClick={() => open(null)}>
          <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
          {t.newCategory}
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
          {[0, 1, 2, 3].map((i) => (
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
            <CategoryList rows={rows} busy={busy} onMove={onMove} onToggle={onToggle} onEdit={open} onRemove={onRemove} />
          </Card>
        ))}

      <CategoryModal
        key={modalKey}
        open={editing !== undefined}
        category={editing ?? null}
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

export default Categories;
