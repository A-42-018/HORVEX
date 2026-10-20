import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge, Button, IconButton } from "../../../components/common";
import { formatDateTime, formatTaka } from "../../../lib/format";
import { strings } from "../../../lib/strings";
import QuickToggle from "../products/QuickToggle";
import { couponState, valueText } from "./couponForm";

const t = strings.admin.coupons;
const BADGE = { live: "success", scheduled: "limited", off: "neutral", expired: "neutral", usedUp: "neutral" };

function RemoveControl({ coupon, busy, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <IconButton label={`${t.remove}: ${coupon.code}`} variant="ghost" disabled={busy} onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden="true" size={20} strokeWidth={1.5} />
      </IconButton>
    );
  }
  return (
    <div role="alertdialog" aria-label={t.removeConfirm(coupon.code, coupon.used)} className="flex w-full flex-col gap-2">
      <p className="text-small text-danger">{t.removeConfirm(coupon.code, coupon.used)}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setConfirming(false);
            onRemove(coupon);
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

function CouponRow({ coupon, busy, now, onToggle, onEdit, onRemove }) {
  const state = couponState(coupon, now);
  const meta = [
    coupon.min_order ? t.meta.minOrder(formatTaka(coupon.min_order)) : t.meta.noMin,
    t.meta.used(coupon.used, coupon.max_uses),
    coupon.starts_at && new Date(coupon.starts_at) > now ? t.meta.starts(formatDateTime(coupon.starts_at)) : null,
    coupon.ends_at ? t.meta.ends(formatDateTime(coupon.ends_at)) : null,
  ].filter(Boolean);

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-all text-body font-semibold tracking-wider text-fg">{coupon.code}</p>
          <Badge variant={BADGE[state]}>{t.state[state]}</Badge>
        </div>
        <p className="text-small text-fg">{valueText(coupon)}</p>
        <p className="text-small text-muted">{meta.join(" · ")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <QuickToggle checked={coupon.is_active} onChange={(value) => onToggle(coupon, value)} label={t.active} name={coupon.code} showLabel />
        <IconButton label={t.edit(coupon.code)} variant="ghost" onClick={() => onEdit(coupon)}>
          <Pencil aria-hidden="true" size={20} strokeWidth={1.5} />
        </IconButton>
        <RemoveControl coupon={coupon} busy={busy} onRemove={onRemove} />
      </div>
    </li>
  );
}

export default function CouponList({ rows, busy, ...handlers }) {
  const now = new Date();
  return (
    <ul className="divide-y divide-line">
      {rows.map((coupon) => (
        <CouponRow key={coupon.id} coupon={coupon} busy={busy} now={now} {...handlers} />
      ))}
    </ul>
  );
}
