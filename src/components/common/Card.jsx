// Surface card: carbon + steel border + inner highlight on dark, parchment +
// soft shadow on ivory (roadmap §3.3). Hover lifts with transform only.
function Card({ children, className = "", hoverable = false, as: Component = "div", ...props }) {
  return (
    <Component
      className={`rounded-card border border-line bg-surface text-fg shadow-surface ${
        hoverable ? "transition-transform duration-base hover:-translate-y-1" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Card;
