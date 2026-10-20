import { Button, Input } from "../../../components/common";
import { strings } from "../../strings";

const t = strings.admin.homeContent.common;

/** datetime-local input with a Clear button (empty = no date). */
export default function DateTimeField({ id, label, value, error, hint, onChange }) {
  return (
    <div className="flex items-start gap-2">
      <Input
        id={id}
        type="datetime-local"
        label={label}
        value={value}
        error={error}
        hint={hint}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1"
      />
      {value && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => onChange("")}>
          {t.clearDate}
          <span className="sr-only"> {label}</span>
        </Button>
      )}
    </div>
  );
}
