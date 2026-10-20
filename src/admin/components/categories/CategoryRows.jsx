import { useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Button, IconButton } from "../../../components/common";
import { strings } from "../../strings";
import QuickToggle from "../products/QuickToggle";
import { isProtected } from "./categoryForm";

const t = strings.admin.categories;

function Thumb({ category }) {
  return (
    <div className="aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-control border border-line bg-surface">
      {category.image ? (
        <img src={category.image} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center px-1 text-center text-eyebrow text-muted">{t.noImage}</span>
      )}
    </div>
  );
}

function RemoveControl({ category, childCount, busy, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  if (isProtected(category)) return null;
  if (!confirming) {
    return (
      <IconButton label={`${t.remove}: ${category.name}`} variant="ghost" disabled={busy} onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden="true" size={20} strokeWidth={1.5} />
      </IconButton>
    );
  }
  return (
    <div role="alertdialog" aria-label={t.removeConfirm(category.name, category.productCount, childCount)} className="flex w-full flex-col gap-2">
      <p className="text-small text-danger">{t.removeConfirm(category.name, category.productCount, childCount)}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setConfirming(false);
            onRemove(category);
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

/** One category row: reorder, thumbnail, name + meta, visibility switch, edit, delete. */
function CategoryRow({ category, index, total, rows, busy, onMove, onToggle, onEdit, onRemove }) {
  const parent = rows.find((row) => row.id === category.parent_id);
  const childCount = rows.filter((row) => row.parent_id === category.id).length;

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex shrink-0 flex-col">
          <IconButton label={t.moveUp(category.name)} variant="ghost" className="h-9 w-9" disabled={busy || index === 0} onClick={() => onMove(category.id, -1)}>
            <ArrowUp aria-hidden="true" size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={t.moveDown(category.name)} variant="ghost" className="h-9 w-9" disabled={busy || index === total - 1} onClick={() => onMove(category.id, 1)}>
            <ArrowDown aria-hidden="true" size={18} strokeWidth={1.5} />
          </IconButton>
        </div>
        <Thumb category={category} />
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-fg">{category.name}</p>
          <p className="truncate text-small text-muted">
            /{category.slug} · {t.products(category.productCount)}
            {parent && ` · ${t.in(parent.name)}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <QuickToggle
          checked={category.is_visible}
          onChange={(value) => onToggle(category, value)}
          label={t.visible}
          name={category.name}
          showLabel
        />
        <IconButton label={t.edit(category.name)} variant="ghost" onClick={() => onEdit(category)}>
          <Pencil aria-hidden="true" size={20} strokeWidth={1.5} />
        </IconButton>
        {category.is_visible && (
          <IconButton
            as={Link}
            to={`/category/${category.slug}`}
            target="_blank"
            rel="noreferrer"
            label={`${t.viewOnStore}: ${category.name}`}
            variant="ghost"
          >
            <ExternalLink aria-hidden="true" size={20} strokeWidth={1.5} />
          </IconButton>
        )}
        <RemoveControl category={category} childCount={childCount} busy={busy} onRemove={onRemove} />
      </div>
    </li>
  );
}

export default function CategoryList({ rows, busy, ...handlers }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((category, index) => (
        <CategoryRow key={category.id} category={category} index={index} total={rows.length} rows={rows} busy={busy} {...handlers} />
      ))}
    </ul>
  );
}
