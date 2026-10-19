const VARIANTS = {
  primary: "bg-accent text-accent-foreground hover:bg-ink/90",
  secondary: "bg-white text-ink border border-border hover:bg-bg-secondary",
  outline: "bg-transparent text-ink border border-ink hover:bg-ink hover:text-white",
  ghost: "bg-transparent text-ink hover:bg-bg-secondary",
};

const SIZES = {
  sm: "h-9 px-4 text-small font-semibold",
  md: "h-11 px-6 text-button",
  lg: "h-12 px-8 text-button",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  as: Component = "button",
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Button;
