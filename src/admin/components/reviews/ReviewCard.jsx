import { useState } from "react";
import { Check, EyeOff, Trash2, X } from "lucide-react";
import { Badge, Button, Rating } from "../../../components/common";
import { formatDateTime } from "../../../lib/format";
import { strings } from "../../../lib/strings";
import { reviewActions } from "./reviewRules";

const t = strings.admin.reviews;
const ICONS = { approve: Check, reject: X, hide: EyeOff };
const BADGE = { approved: "success", pending: "limited", rejected: "neutral" };

/** One review row: content, status badge, moderation buttons and an inline delete confirm. */
export default function ReviewCard({ review, busy, onAction, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  const who = review.name;

  return (
    <li className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:px-6">
      {review.photo_url && (
        <img src={review.photo_url} alt={t.photoOf(who)} loading="lazy" className="h-24 w-24 shrink-0 rounded-card border border-line object-cover" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-body font-semibold text-fg">{who}</p>
          <Rating value={review.rating} showValue={false} />
          <Badge variant={BADGE[review.status]}>{t.status[review.status]}</Badge>
        </div>
        <p className="text-small text-muted">
          {review.product?.name ?? t.wholeStore} · {formatDateTime(review.created_at)}
        </p>
        {review.text && <p className="whitespace-pre-line break-words text-body text-fg">{review.text}</p>}

        {confirming ? (
          <div role="group" aria-label={t.removeLabel(who)} className="flex flex-wrap items-center gap-3 pt-1">
            <p className="text-small text-fg">{t.removeConfirm(who)}</p>
            <Button size="sm" variant="secondary" loading={busy} onClick={() => onRemove(review)}>
              {strings.admin.homeContent.common.removeYes}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              {strings.admin.homeContent.common.removeNo}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {reviewActions(review.status).map((action) => {
              const Icon = ICONS[action];
              return (
                <Button
                  key={action}
                  size="sm"
                  variant={action === "approve" ? "primary" : "secondary"}
                  className="gap-2"
                  disabled={busy}
                  aria-label={t.actionLabel[action](who)}
                  onClick={() => onAction(review, action)}
                >
                  <Icon aria-hidden="true" size={16} strokeWidth={1.5} />
                  {t.actions[action]}
                </Button>
              );
            })}
            <Button size="sm" variant="ghost" className="gap-2" disabled={busy} aria-label={t.removeLabel(who)} onClick={() => setConfirming(true)}>
              <Trash2 aria-hidden="true" size={16} strokeWidth={1.5} />
              {t.remove}
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}
