const VARIANTS = {
  sale: "bg-sale/10 text-sale",
  new: "bg-accent/10 text-ink",
  success: "bg-success/10 text-success",
  neutral: "bg-bg-secondary text-ink-secondary",
};

function Badge({ children, variant = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-small font-semibold ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
