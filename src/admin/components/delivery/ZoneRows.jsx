import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Badge, Button, IconButton } from "../../../components/common";
import { formatTaka } from "../../../lib/format";
import { strings } from "../../strings";
import QuickToggle from "../products/QuickToggle";
import { canDelete, isLastActive } from "./zoneForm";

const t = strings.admin.delivery;

function RemoveControl({ zone, rows, busy, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  if (!canDelete(rows, zone)) return null;
  if (!confirming) {
    return (
      <IconButton label={`${t.remove}: ${zone.name}`} variant="ghost" disabled={busy} onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden="true" size={20} strokeWidth={1.5} />
      </IconButton>
    );
  }
  return (
    <div role="alertdialog" aria-label={t.removeConfirm(zone.name)} className="flex w-full flex-col gap-2">
      <p className="text-small text-danger">{t.removeConfirm(zone.name)}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setConfirming(false);
            onRemove(zone);
          }}
        >
          {t.removeYes}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          {t.removeNo}
        </Button>
      </div>
    </div>
  );
}

/** One zone row: reorder, name + meta, On switch, edit, delete (hidden when it must stay). */
function ZoneRow({ zone, index, total, rows, busy, onMove, onToggle, onEdit, onRemove }) {
  const keepReason = zone.orderCount > 0 ? t.keepReasons.orders : isLastActive(rows, zone) ? t.keepReasons.last : null;

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex shrink-0 flex-col">
          <IconButton label={t.moveUp(zone.name)} variant="ghost" disabled={busy || index === 0} onClick={() => onMove(zone.id, -1)}>
            <ArrowUp aria-hidden="true" size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={t.moveDown(zone.name)} variant="ghost" disabled={busy || index === total - 1} onClick={() => onMove(zone.id, 1)}>
            <ArrowDown aria-hidden="true" size={18} strokeWidth={1.5} />
          </IconButton>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-body font-semibold text-fg">{zone.name}</p>
            {!zone.is_active && <Badge variant="neutral">{t.off}</Badge>}
          </div>
          <p className="text-small text-fg">{zone.charge === 0 ? t.free : formatTaka(zone.charge)}</p>
          <p className="text-small text-muted">
            {zone.eta_text || t.noEta} · {t.orders(zone.orderCount)}
          </p>
          {keepReason && <p className="sr-only">{t.keepNote(zone.name, keepReason)}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <QuickToggle checked={zone.is_active} onChange={(value) => onToggle(zone, value)} label={t.active} name={zone.name} showLabel />
        <IconButton label={t.edit(zone.name)} variant="ghost" onClick={() => onEdit(zone)}>
          <Pencil aria-hidden="true" size={20} strokeWidth={1.5} />
        </IconButton>
        <RemoveControl zone={zone} rows={rows} busy={busy} onRemove={onRemove} />
      </div>
    </li>
  );
}

export default function ZoneList({ rows, busy, ...handlers }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((zone, index) => (
        <ZoneRow key={zone.id} zone={zone} index={index} total={rows.length} rows={rows} busy={busy} {...handlers} />
      ))}
    </ul>
  );
}
