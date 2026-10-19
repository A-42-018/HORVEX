import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { FieldMessage, fieldClass, floatingLabelClass } from "./Input";
import { strings } from "../../lib/strings";

// Native <select> (best keyboard and mobile support) in the Input look. The
// label stays floated because a select always shows a value. Pass `options`
// as [{ value, label }] or plain children <option>s.
function Select({
  label,
  options,
  placeholder = strings.form.selectPlaceholder,
  error,
  hint,
  id,
  className = "",
  children,
  ref,
  ...props
}) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const messageId = `${selectId}-message`;

  return (
    <div className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          // Uncontrolled with a placeholder: start on the placeholder, not the first option.
          defaultValue={placeholder && props.value === undefined && props.defaultValue === undefined ? "" : undefined}
          className={`${fieldClass} h-14 cursor-pointer appearance-none pr-11 pt-5 ${error ? "border-danger" : "border-control"}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <label htmlFor={selectId} className={`${floatingLabelClass} -translate-y-0.5 scale-75`}>
          {label}
        </label>
        <ChevronDown
          aria-hidden="true"
          size={20}
          strokeWidth={1.5}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

export default Select;
