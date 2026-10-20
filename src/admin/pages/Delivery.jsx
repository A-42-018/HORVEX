import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Card, Skeleton } from "../../components/common";
import { strings } from "../strings";
import { moveRow } from "../components/categories/categoryForm";
import ThresholdCard from "../components/delivery/ThresholdCard";
import ZoneModal from "../components/delivery/ZoneModal";
import ZoneList from "../components/delivery/ZoneRows";
import { activeCount, isLastActive } from "../components/delivery/zoneForm";
import { useReorderZones, useToggleZone, useZoneCrud, useZoneRows } from "../hooks/useZoneAdmin";

const t = strings.admin.delivery;

const failureFor = (error, fallback) => (error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : fallback);

function Delivery() {
  const { data: rows, isPending, isError, refetch } = useZoneRows();
  const crud = useZoneCrud();
  const toggle = useToggleZone();
  const reorder = useReorderZones();
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, row = edit
  const [modalKey, setModalKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const busy = reorder.isPending || crud.remove.isPending;

  const open = (zone) => {
    setModalKey((n) => n + 1);
    setEditing(zone);
  };

  const onToggle = (zone, value) => {
    setNotice("");
    if (!value && isLastActive(rows, zone)) {
      setFailure(t.messages.lastActive);
      return;
    }
    setFailure("");
    toggle.mutate(
      { id: zone.id, patch: { is_active: value } },
      { onError: (error) => setFailure(failureFor(error, t.messages.toggleFailed(zone.name))) },
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

  const onRemove = (zone) => {
    setFailure("");
    crud.remove.mutate(zone, {
      onSuccess: () => setNotice(t.messages.removed(zone.name)),
      onError: (error) => setFailure(failureFor(error, t.messages.removeFailed)),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | WRISTORY Admin`}</title>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h3 text-fg">{t.title}</h1>
          {rows && <p className="text-small text-muted">{t.count(rows.length, activeCount(rows))}</p>}
        </div>
        <Button size="sm" className="gap-2" onClick={() => open(null)}>
          <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
          {t.newZone}
        </Button>
      </div>
      <p className="max-w-prose text-small text-muted">{t.intro}</p>

      <ThresholdCard />

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
            <ZoneList rows={rows} busy={busy} onMove={onMove} onToggle={onToggle} onEdit={open} onRemove={onRemove} />
          </Card>
        ))}

      <ZoneModal
        key={modalKey}
        open={editing !== undefined}
        zone={editing ?? null}
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

export default Delivery;
