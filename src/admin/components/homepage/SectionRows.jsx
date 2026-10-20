import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Pencil } from "lucide-react";
import { Badge, IconButton } from "../../../components/common";
import { strings } from "../../strings";
import QuickToggle from "../products/QuickToggle";
import { metaFor } from "./homeSections";

const t = strings.admin.homepage;

function TextPreview({ row, fields }) {
  if (!fields) return <p className="text-small text-muted">{t.noText}</p>;
  const lines = [row.title, row.subtitle].filter(Boolean);
  return (
    <p className="line-clamp-2 text-small text-muted">
      {lines.length ? lines.join(" · ") : t.defaultText}
    </p>
  );
}

/** One home section: grip, arrows, name + current text, visibility switch, edit. */
function SectionRow({ row, index, total, busy, onMove, onToggle, onEdit }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: busy,
  });
  const { label, about, fields } = metaFor(row.key);

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
          aria-label={t.dragHandle(label)}
          disabled={busy}
          className="inline-flex h-11 w-11 shrink-0 touch-none cursor-grab items-center justify-center rounded-control text-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" size={20} strokeWidth={1.5} />
        </button>
        <div className="flex shrink-0 flex-col">
          <IconButton label={t.moveUp(label)} variant="ghost" className="h-9 w-9" disabled={busy || index === 0} onClick={() => onMove(row.id, -1)}>
            <ArrowUp aria-hidden="true" size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={t.moveDown(label)} variant="ghost" className="h-9 w-9" disabled={busy || index === total - 1} onClick={() => onMove(row.id, 1)}>
            <ArrowDown aria-hidden="true" size={18} strokeWidth={1.5} />
          </IconButton>
        </div>
        <span aria-hidden="true" className="w-6 shrink-0 text-center text-small tabular-nums text-muted">
          {t.position(index + 1)}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-body font-semibold text-fg">
            <span className="truncate">{label}</span>
            {!row.is_visible && <Badge>{t.hiddenBadge}</Badge>}
          </p>
          {about && <p className="text-small text-muted">{about}</p>}
          <TextPreview row={row} fields={fields} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <QuickToggle checked={row.is_visible} onChange={(value) => onToggle(row, value)} label={t.visible} name={label} showLabel />
        {fields && (
          <IconButton label={t.editText(label)} variant="ghost" onClick={() => onEdit(row)}>
            <Pencil aria-hidden="true" size={20} strokeWidth={1.5} />
          </IconButton>
        )}
      </div>
    </li>
  );
}

export default function SectionList({ rows, busy, onMove, onDrag, onToggle, onEdit }) {
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
            <SectionRow key={row.id} row={row} index={index} total={rows.length} busy={busy} onMove={onMove} onToggle={onToggle} onEdit={onEdit} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
