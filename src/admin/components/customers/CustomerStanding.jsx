import { useState } from "react";
import { Button } from "../../../components/common";
import { strings } from "../../strings";
import { useCustomerByPhone } from "../../hooks/useCustomerAdmin";
import BlockModal from "./BlockModal";
import { CustomerBadge } from "./CustomerRows";

const t = strings.admin.customers.standing;
const tb = strings.admin.customers.block;

/** Compact history + Block / Unblock for the customer card on the order detail page. */
function CustomerStanding({ phone, name }) {
  const { data, isPending, isError } = useCustomerByPhone(phone);
  const [mode, setMode] = useState(null);
  const [notice, setNotice] = useState("");

  if (isPending) return <p className="text-small text-muted">…</p>;
  if (isError) return <p className="text-small text-muted">{t.error}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2 rounded-card border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-small font-semibold text-fg">{t.title}</p>
        <CustomerBadge customer={data} />
      </div>
      <p className="text-small text-muted">
        {data.orders_count === 1 ? t.first : t.summary(data.orders_count, data.delivered_count, data.cancelled_count)}
      </p>
      {data.is_blocked && <p className="text-small text-fg">{t.blockedNote}</p>}
      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMode(data.is_blocked ? "unblock" : "block")}
          aria-label={data.is_blocked ? tb.unblockFor(name) : tb.buttonFor(name)}
        >
          {data.is_blocked ? tb.unblock : tb.button}
        </Button>
      </div>
      <p role="status" className="text-small text-muted">
        {notice}
      </p>
      {mode && <BlockModal customer={{ phone, name }} mode={mode} onClose={() => setMode(null)} onDone={setNotice} />}
    </div>
  );
}

export default CustomerStanding;
