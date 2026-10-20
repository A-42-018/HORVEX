import { useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Badge, Button, IconButton } from "../../../components/common";
import { formatDateTime, formatTaka } from "../../../lib/format";
import { strings } from "../../strings";
import QuickToggle from "../products/QuickToggle";
import { describeRules, scheduleState } from "./collectionForm";

const t = strings.admin.collections;

function Thumb({ collection }) {
  return (
    <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-control border border-line bg-surface">
      {collection.banner ? (
        <img src={collection.banner} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center px-1 text-center text-eyebrow text-muted">{t.noImage}</span>
      )}
    </div>
  );
}

/** Live / scheduled / ended / hidden pill, with the relevant date as text next to it. */
function StateBadge({ collection }) {
  const state = scheduleState(collection);
  const label =
    state === "scheduled"
      ? t.state.scheduled(formatDateTime(collection.active_from))
      : state === "ended"
        ? t.state.ended(formatDateTime(collection.active_to))
        : state === "live" && collection.active_to
          ? t.state.endsOn(formatDateTime(collection.active_to))
          : t.state[state];
  return <Badge variant={state === "live" ? "success" : "neutral"}>{label}</Badge>;
}

function RemoveControl({ collection, busy, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <IconButton label={`${t.remove}: ${collection.title}`} variant="ghost" disabled={busy} onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden="true" size={20} strokeWidth={1.5} />
      </IconButton>
    );
  }
  return (
    <div role="alertdialog" aria-label={t.removeConfirm(collection.title)} className="flex w-full flex-col gap-2">
      <p className="text-small text-danger">{t.removeConfirm(collection.title)}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setConfirming(false);
            onRemove(collection);
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

function CollectionRow({ collection, index, total, categoryNames, busy, onMove, onToggle, onEdit, onRemove }) {
  const summary =
    collection.mode === "rules"
      ? describeRules(collection.rules, { categoryName: (slug) => categoryNames.get(slug) ?? slug, taka: formatTaka }) || t.ruleSummary.none
      : t.picked(collection.productCount);
  const viewable = scheduleState(collection) === "live";

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex shrink-0 flex-col">
          <IconButton label={t.moveUp(collection.title)} variant="ghost" className="h-9 w-9" disabled={busy || index === 0} onClick={() => onMove(collection.id, -1)}>
            <ArrowUp aria-hidden="true" size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton label={t.moveDown(collection.title)} variant="ghost" className="h-9 w-9" disabled={busy || index === total - 1} onClick={() => onMove(collection.id, 1)}>
            <ArrowDown aria-hidden="true" size={18} strokeWidth={1.5} />
          </IconButton>
        </div>
        <Thumb collection={collection} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-body font-semibold text-fg">{collection.title}</p>
          <p className="truncate text-small text-muted">
            /{collection.slug} · {t.modes[collection.mode]} · {summary}
          </p>
          <div>
            <StateBadge collection={collection} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <QuickToggle checked={collection.is_visible} onChange={(value) => onToggle(collection, value)} label={t.visible} name={collection.title} showLabel />
        <IconButton label={t.edit(collection.title)} variant="ghost" onClick={() => onEdit(collection)}>
          <Pencil aria-hidden="true" size={20} strokeWidth={1.5} />
        </IconButton>
        {viewable && (
          <IconButton as={Link} to={`/collection/${collection.slug}`} target="_blank" rel="noreferrer" label={`${t.viewOnStore}: ${collection.title}`} variant="ghost">
            <ExternalLink aria-hidden="true" size={20} strokeWidth={1.5} />
          </IconButton>
        )}
        <RemoveControl collection={collection} busy={busy} onRemove={onRemove} />
      </div>
    </li>
  );
}

export default function CollectionList({ rows, categoryNames, busy, ...handlers }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((collection, index) => (
        <CollectionRow key={collection.id} collection={collection} index={index} total={rows.length} categoryNames={categoryNames} busy={busy} {...handlers} />
      ))}
    </ul>
  );
}
