import { Star } from "lucide-react";
import { strings } from "../../lib/strings";

// Read-only star rating with partial fill. The numeric value is shown next to
// the stars so the stars aren't the only carrier of the information; screen
// readers get a single label instead of five icons.
function Stars({ className }) {
  return (
    <span className={`flex gap-0.5 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={16} strokeWidth={1.5} fill="currentColor" className="shrink-0" />
      ))}
    </span>
  );
}

function Rating({ value, count, showValue = true, className = "" }) {
  const rounded = Math.round(value * 10) / 10;
  const fill = `${Math.min(Math.max(value / 5, 0), 1) * 100}%`;

  return (
    <div role="img" aria-label={strings.rating.label(rounded, count)} className={`flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex" aria-hidden="true">
        <Stars className="text-control" />
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: fill }}>
          <Stars className="text-brand" />
        </span>
      </span>
      {(showValue || count != null) && (
        <span className="text-small tabular-nums text-muted" aria-hidden="true">
          {showValue && rounded.toFixed(1)}
          {count != null && ` (${count})`}
        </span>
      )}
    </div>
  );
}

export default Rating;
