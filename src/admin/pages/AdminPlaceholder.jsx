import { useLocation } from "react-router";

function AdminPlaceholder({ title, phase }) {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-small font-semibold uppercase tracking-wider text-ink-secondary">Coming in Phase {phase}</span>
      <h1 className="text-h3 text-ink">{title}</h1>
      <p className="text-small text-ink-secondary">Route: {pathname}</p>
    </div>
  );
}

export default AdminPlaceholder;
