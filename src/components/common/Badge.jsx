// Roadmap §3.4: small-caps pill. Max one badge per card; only show a discount
// badge when discountPercent() returns a value (≥ 10%).
// `success` and `neutral` are kept for the template.
const VARIANTS = {
  new: "border border-fg text-fg",
  sale: "bg-oxblood text-ivory",
  limited: "border border-brand text-brand",
  soldOut: "bg-steel text-ivory",
  success: "bg-emerald text-ivory",
  neutral: "border border-control text-muted",
};

function Badge({ children, variant = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex h-6 items-center whitespace-nowrap rounded-pill px-2.5 text-badge ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
