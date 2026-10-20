import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Card, Skeleton } from "../../components/common";
import { strings } from "../strings";
import CouponModal from "../components/coupons/CouponModal";
import CouponList from "../components/coupons/CouponRows";
import { couponState } from "../components/coupons/couponForm";
import { useCouponCrud, useCouponRows, useToggleCoupon } from "../hooks/useCouponAdmin";

const t = strings.admin.coupons;

const failureFor = (error, fallback) => (error?.code === "42501" || error?.code === "PGRST116" ? t.messages.forbidden : fallback);

function Coupons() {
  const { data: rows, isPending, isError, refetch } = useCouponRows();
  const crud = useCouponCrud();
  const toggle = useToggleCoupon();
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, row = edit
  const [modalKey, setModalKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");

  const open = (coupon) => {
    setModalKey((n) => n + 1);
    setEditing(coupon);
  };

  const onToggle = (coupon, value) => {
    setFailure("");
    setNotice("");
    toggle.mutate(
      { id: coupon.id, patch: { is_active: value } },
      { onError: (error) => setFailure(failureFor(error, t.messages.toggleFailed(coupon.code))) },
    );
  };

  const onRemove = (coupon) => {
    setFailure("");
    crud.remove.mutate(coupon.id, {
      onSuccess: () => setNotice(t.messages.removed(coupon.code)),
      onError: (error) => setFailure(failureFor(error, t.messages.removeFailed)),
    });
  };

  const live = rows ? rows.filter((row) => couponState(row) === "live").length : 0;

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | WRISTORY Admin`}</title>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h3 text-fg">{t.title}</h1>
          {rows && <p className="text-small text-muted">{t.count(rows.length, live)}</p>}
        </div>
        <Button size="sm" className="gap-2" onClick={() => open(null)}>
          <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
          {t.newCoupon}
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
            <CouponList rows={rows} busy={crud.remove.isPending} onToggle={onToggle} onEdit={open} onRemove={onRemove} />
          </Card>
        ))}

      <CouponModal
        key={modalKey}
        open={editing !== undefined}
        coupon={editing ?? null}
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

export default Coupons;
