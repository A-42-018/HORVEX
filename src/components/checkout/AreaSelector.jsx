import { useId } from "react";
import { FieldMessage } from "../common/Input";
import { formatTaka } from "../../lib/format";
import { strings } from "../../lib/strings";

const t = strings.checkout;

// Segmented delivery-area control (roadmap §6.7 #4): one radio per zone, charge
// and ETA from the DB. Native radios keep arrow-key and screen-reader behaviour.
function AreaSelector({ zones, value, onChange, error }) {
  const name = useId();
  const messageId = `${name}-message`;

  return (
    <fieldset aria-describedby={error ? messageId : undefined}>
      <legend className="mb-3 text-small text-muted">{t.areaLegend}</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {zones.map((zone) => {
          const id = String(zone.id);
          return (
            <label
              key={id}
              className={`flex min-h-11 cursor-pointer flex-col gap-1 rounded-control border bg-raised p-4 transition-colors duration-fast has-[:checked]:border-brand has-[:checked]:bg-surface has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus ${
                error ? "border-danger" : "border-control"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={id}
                checked={value === id}
                onChange={() => onChange(id)}
                className="sr-only"
              />
              <span className="text-body text-fg">{zone.name}</span>
              <span className="text-small tabular-nums text-brand">{formatTaka(zone.charge)}</span>
              {zone.eta_text && <span className="text-small text-muted">{zone.eta_text}</span>}
            </label>
          );
        })}
      </div>
      <FieldMessage id={messageId} error={error} />
    </fieldset>
  );
}

export default AreaSelector;
