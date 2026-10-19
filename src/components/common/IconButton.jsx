// 44×44 icon-only button (roadmap §3.4). `label` is required: it's the only
// accessible name. Pass `pressed` for toggles (wishlist): it sets aria-pressed
// and turns the ring and icon gold. Icons: lucide at size 20, strokeWidth 1.5.
const VARIANTS = {
  outline: "border border-line hover:border-control",
  ghost: "hover:bg-fg/10",
};

function IconButton({
  label,
  pressed,
  variant = "outline",
  className = "",
  children,
  as: Component = "button",
  ...props
}) {
  const active = pressed === true;

  return (
    <Component
      aria-label={label}
      aria-pressed={pressed}
      {...(Component === "button" ? { type: "button" } : {})}
      className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-[color,background-color,border-color,transform] duration-fast active:scale-95 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${
        active ? "!border-brand text-brand" : "text-fg"
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export default IconButton;
