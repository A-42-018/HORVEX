const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";

/**
 * On/off switch for a quick product setting. The 44px button is the tap target;
 * the visible track is smaller. `label` names the setting, `name` the product
 * (both reach screen readers); `showLabel` also prints the label (mobile cards).
 */
function QuickToggle({ checked, onChange, label, name, showLabel = false, className = "" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : `${label}: ${name}`}
      onClick={() => onChange(!checked)}
      className={`inline-flex min-h-11 items-center gap-2 rounded-control ${showLabel ? "pr-2" : "min-w-11 justify-center"} ${focusRing} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-pill transition-colors duration-fast ${checked ? "bg-brand" : "bg-fg/20"}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full transition-transform duration-fast ${
            checked ? "translate-x-5 bg-obsidian" : "translate-x-0 bg-fg"
          }`}
        />
      </span>
      {showLabel && (
        <span className="text-small text-fg">
          {label}
          <span className="sr-only">: {name}</span>
        </span>
      )}
    </button>
  );
}

export default QuickToggle;
