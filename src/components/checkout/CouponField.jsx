import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button, IconButton, Input } from "../common";
import { strings } from "../../lib/strings";

const copy = strings.cart.page;

/**
 * Collapsible "Have a coupon?" (roadmap §6.7). The parent owns the applied code and
 * the server verdict; this only collects the code. Stays open while a message shows.
 */
function CouponField({ applied, message, disabled, onApply, onRemove }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-control border border-line px-4 py-2">
        <p className="text-small text-fg">{copy.couponApplied(applied)}</p>
        <IconButton label={copy.couponRemove} variant="ghost" onClick={onRemove}>
          <X size={16} strokeWidth={1.5} aria-hidden="true" />
        </IconButton>
      </div>
    );
  }

  const expanded = open || Boolean(message);
  const submit = (event) => {
    event.preventDefault();
    const code = draft.trim().toUpperCase();
    if (!code) return;
    onApply(code);
    setDraft("");
  };

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setOpen(!expanded)}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-small text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {strings.checkout.summary.couponPrompt}
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          className={`transition-transform duration-fast ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <form onSubmit={submit} className="mt-2 flex items-start gap-3">
          <Input
            label={copy.couponLabel}
            className="min-w-0 flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            error={message}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" variant="secondary" className="h-14" disabled={disabled || !draft.trim()}>
            {copy.couponApply}
          </Button>
        </form>
      )}
    </div>
  );
}

export default CouponField;
