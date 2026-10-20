import { useLocation } from "react-router";

function AdminPlaceholder({ title, phase }) {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-small font-semibold uppercase tracking-wider text-muted">Coming in Phase {phase}</span>
      <h1 className="text-title text-fg">{title}</h1>
      <p className="text-small text-muted">Route: {pathname}</p>
    </div>
  );
}

export default AdminPlaceholder;
