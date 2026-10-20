import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../components/common";

/**
 * "Export CSV" with a live status line. `mutation` is useExportOrders /
 * useExportCustomers; `copy` is that page's strings.export; `filters` is what to export.
 */
function ExportButton({ mutation, copy, filters, disabled = false }) {
  const [message, setMessage] = useState(null);

  const run = () => {
    setMessage(null);
    mutation.mutate(filters, {
      onSuccess: ({ count, capped }) =>
        setMessage({ tone: "ok", text: count === 0 ? copy.empty : capped ? copy.capped(count) : copy.done(count) }),
      onError: () => setMessage({ tone: "error", text: copy.error }),
    });
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button variant="secondary" size="sm" onClick={run} loading={mutation.isPending} disabled={disabled}>
        <Download aria-hidden="true" size={18} strokeWidth={1.5} />
        {mutation.isPending ? copy.busy : copy.button}
      </Button>
      <p role={message?.tone === "error" ? "alert" : "status"} className={`text-small ${message?.tone === "error" ? "text-danger" : "text-muted"}`}>
        {message?.text}
      </p>
    </div>
  );
}

export default ExportButton;
