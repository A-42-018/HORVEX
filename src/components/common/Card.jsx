function Card({ children, className = "", hoverable = false }) {
  return (
    <div
      className={`rounded-lg border border-border bg-white shadow-card ${
        hoverable ? "transition-[box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-lg" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
