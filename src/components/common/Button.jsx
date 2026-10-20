import { LoaderCircle } from "lucide-react";

// Roadmap §3.4. Colours come from the surface vars, so one variant works on dark
// and ivory. `outline` and `ghost` are template aliases.
const VARIANTS = {
  // Gold fill on every surface; obsidian text is ≥ 8.7:1 on gold and gold-light.
  primary:
    "bg-gold text-obsidian hover:bg-gold-light before:pointer-events-none before:absolute before:-z-10 before:inset-y-0 before:-left-1/2 before:w-1/2 before:-translate-x-full before:skew-x-[-20deg] before:bg-gradient-to-r before:from-transparent before:via-ivory/40 before:to-transparent before:transition-transform before:duration-slow hover:before:translate-x-[400%]",
  secondary: "border border-fg text-fg hover:bg-fg hover:text-on-fg",
  ghost: "text-fg hover:bg-fg/10",
  // Destructive actions (admin deletes); ivory on oxblood is ≥ 6:1.
  danger: "bg-oxblood text-ivory hover:bg-oxblood/90",
  link: "!h-auto min-h-11 !px-0 text-brand after:absolute after:inset-x-0 after:bottom-2.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-base hover:after:scale-x-100",
};
VARIANTS.outline = VARIANTS.secondary;

const SIZES = {
  sm: "h-11 px-5 text-button",
  md: "h-12 px-7 text-button",
  // 52px on mobile, 48px from sm up (§3.4 mobile CTA)
  lg: "h-13 px-8 text-button sm:h-12",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  as: Component = "button",
  ...props
}) {
  const isButton = Component === "button";

  return (
    <Component
      className={`relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-control transition-[color,background-color,transform] duration-fast active:scale-[0.98] aria-disabled:pointer-events-none aria-disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...(isButton ? { type: "button", disabled: disabled || loading } : {})}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden="true" size={18} strokeWidth={1.5} className="animate-spin" />}
      {children}
    </Component>
  );
}

export default Button;
