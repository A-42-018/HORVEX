import { useState } from "react";
import { Button, Input, Modal } from "../../../components/common";
import { formatPhone } from "../../../lib/format";
import { strings } from "../../../lib/strings";
import { useBlockPhone, useUnblockPhone } from "../../hooks/useCustomerAdmin";
import { MAX_REASON, readReason } from "./customerRules";

const t = strings.admin.customers.block;
const isForbidden = (error) => error?.code === "42501" || error?.code === "PGRST116";

/** Block (with an optional reason) or unblock a phone. `customer` = { phone, name }; `mode` = "block" | "unblock". */
function BlockModal({ customer, mode, onClose, onDone }) {
  const blocking = mode === "block";
  const block = useBlockPhone();
  const unblock = useUnblockPhone();
  const mutation = blocking ? block : unblock;
  const [reason, setReason] = useState("");
  const parsed = readReason(reason);
  const phone = formatPhone(customer.phone);

  const submit = () => {
    if (blocking && parsed.tooLong) return;
    const done = () => {
      onDone?.(blocking ? t.blocked(customer.name) : t.unblocked(customer.name));
      onClose();
    };
    if (blocking) block.mutate({ phone: customer.phone, reason: parsed.value }, { onSuccess: done });
    else unblock.mutate(customer.phone, { onSuccess: done });
  };

  const failure = mutation.error ? (isForbidden(mutation.error) ? t.forbidden : blocking ? t.error : t.unblockError) : null;

  return (
    <Modal
      open
      onClose={mutation.isPending ? () => {} : onClose}
      tone="ivory"
      size="sm"
      title={blocking ? t.title : t.unblockTitle}
      description={blocking ? t.body(customer.name, phone) : t.unblockBody(customer.name, phone)}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={mutation.isPending}>
            {t.cancel}
          </Button>
          <Button size="sm" onClick={submit} loading={mutation.isPending} disabled={blocking && parsed.tooLong}>
            {mutation.isPending ? (blocking ? t.saving : t.unblockSaving) : blocking ? t.confirm : t.unblockConfirm}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {blocking && (
          <Input
            label={t.reason}
            multiline
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            hint={t.reasonHint}
            error={parsed.tooLong ? t.reasonLong(MAX_REASON) : undefined}
          />
        )}
        {failure && (
          <p role="alert" className="text-small text-danger">
            {failure}
          </p>
        )}
      </div>
    </Modal>
  );
}

export default BlockModal;
