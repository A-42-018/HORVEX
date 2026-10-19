import { useId } from "react";
import { CircleAlert } from "lucide-react";
import { strings } from "../../lib/strings";

// Shared field look for Input and Select (roadmap §3.4): raised fill, 3:1
// control border, gold border + ring on focus, danger border when invalid.
export const fieldClass =
  "peer block w-full rounded-control border bg-raised px-4 text-body text-fg transition-colors duration-fast focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-50";

// Floating label: sits in the field while it's empty, floats up on focus or
// once there's a value (placeholder=" " drives :placeholder-shown). Moves with
// transform only.
export const floatingLabelClass =
  "pointer-events-none absolute left-4 top-2 origin-top-left text-body text-muted transition-transform duration-base";

export function FieldMessage({ id, error, hint }) {
  if (error) {
    return (
      <p id={id} className="mt-2 flex items-start gap-1.5 text-small text-danger">
        <CircleAlert aria-hidden="true" size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
        {error}
      </p>
    );
  }
  return hint ? (
    <p id={id} className="mt-2 text-small text-muted">
      {hint}
    </p>
  ) : null;
}

function Input({
  label,
  error,
  hint,
  optional = false,
  multiline = false,
  id,
  className = "",
  ref,
  ...props
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const Field = multiline ? "textarea" : "input";

  return (
    <div className={className}>
      <div className="relative">
        <Field
          ref={ref}
          id={inputId}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`${fieldClass} ${multiline ? "min-h-32 resize-y pb-3 pt-7" : "h-14 pt-5"} ${error ? "border-danger" : "border-control"}`}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={`${floatingLabelClass} -translate-y-0.5 scale-75 peer-placeholder-shown:scale-100 peer-focus:-translate-y-0.5 peer-focus:scale-75 ${
            multiline ? "peer-placeholder-shown:translate-y-5" : "peer-placeholder-shown:translate-y-1.5"
          }`}
        >
          {label}
          {optional && <span className="text-muted"> ({strings.common.optional})</span>}
        </label>
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

export default Input;
