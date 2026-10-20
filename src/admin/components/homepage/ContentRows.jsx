import { useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button, IconButton } from "../../../components/common";
import { strings } from "../../strings";
import QuickToggle from "../products/QuickToggle";

const common = strings.admin.homeContent.common;

export function RemoveControl({ copy, name, busy, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <IconButton label={copy.removeLabel(name)} variant="ghost" disabled={busy} onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden="true" size={20} strokeWidth={1.5} />
      </IconButton>
    );
  }
  return (
    <div role="alertdialog" aria-label={copy.removeConfirm(name)} className="flex w-full flex-col gap-2">
      <p className="text-small text-danger">{copy.removeConfirm(name)}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setConfirming(false);
            onRemove();
          }}
        >
          {common.removeYes}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          {common.removeNo}
        </Button>
      </div>
    </div>
  );
}

/** One sortable row: grip, arrows, thumbnail + caller's info, on/off switch, edit, delete. */
function ContentRow({ row, index, total, busy, copy, nameOf, thumb, info, activeField = "is_active", onMove, onToggle, onEdit, onRemove }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: busy,
  });
  const name = nameOf(row);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col gap-3 bg-raised p-4 sm:flex-row sm:items-center sm:gap-4 ${isDragging ? "relative z-10 opacity-80 shadow-surface" : ""}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label={copy.dragHandle(name)}
          disabled={busy}
          className="inline-flex h-11 w-11 shrink-0 touch-none cursor-grab items-center justify-center rounded-control text-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" size={20} strokeWidth={1.5} />
        </button>
        <div className="flex shrink-0 flex-col">
          <IconButton label={copy.moveUp(name)} variant="ghost" disabled={busy || index === 0} onClick={() => onMove(row.id, -1)}>
            <ArrowUp aria-hidden="true" size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={copy.moveDown(name)} variant="ghost" disabled={busy || index === total - 1} onClick={() => onMove(row.id, 1)}>
            <ArrowDown aria-hidden="true" size={18} strokeWidth={1.5} />
          </IconButton>
        </div>
        <span aria-hidden="true" className="w-6 shrink-0 text-center text-small tabular-nums text-muted">
          {common.position(index + 1)}
        </span>
        {thumb && (
          <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-control border border-line bg-surface">
            {thumb(row) ? (
              <img src={thumb(row)} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center px-1 text-center text-eyebrow text-muted">{common.noImage}</span>
            )}
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">{info(row)}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <QuickToggle checked={row[activeField]} onChange={(value) => onToggle(row, value)} label={copy.visible} name={name} showLabel />
        <IconButton label={copy.edit(name)} variant="ghost" onClick={() => onEdit(row)}>
          <Pencil aria-hidden="true" size={20} strokeWidth={1.5} />
        </IconButton>
        <RemoveControl copy={copy} name={name} busy={busy} onRemove={() => onRemove(row)} />
      </div>
    </li>
  );
}

export default function ContentRows({ rows, busy, onDrag, ...props }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }) => {
    if (busy || !over || active.id === over.id) return;
    onDrag(active.id, over.id);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-line">
          {rows.map((row, index) => (
            <ContentRow key={row.id} row={row} index={index} total={rows.length} busy={busy} {...props} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
