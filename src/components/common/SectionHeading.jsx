function SectionHeading({ eyebrow, title, subtitle, align = "center", className = "" }) {
  const alignClass = align === "left" ? "text-left items-start" : "text-center items-center";

  return (
    <div className={`flex flex-col gap-3 ${alignClass} ${className}`}>
      {eyebrow && (
        <span className="text-small font-semibold uppercase tracking-wider text-ink-secondary">
          {eyebrow}
        </span>
      )}
      <h2 className="text-h2 text-ink">{title}</h2>
      {subtitle && <p className="text-body text-ink-secondary max-w-2xl">{subtitle}</p>}
    </div>
  );
}

export default SectionHeading;
