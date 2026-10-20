import { Link } from "react-router";
import { strings } from "../strings";
import { useAuth } from "./authContext";
import { hasRole } from "./roles";

const t = strings.admin.forbidden;

// Per-page role gate inside the admin shell. RLS would refuse the data anyway;
// this keeps a staff member from landing on an empty, broken page.
function RequireRole({ minRole, children }) {
  const { profile } = useAuth();
  if (hasRole(profile?.role, minRole)) return children;

  return (
    <div className="flex flex-col items-start gap-2">
      <title>{`${t.title} | WRISTORY Admin`}</title>
      <h1 className="text-title text-fg">{t.title}</h1>
      <p className="text-small text-muted">{t.body(strings.admin.roles[profile?.role] ?? profile?.role)}</p>
      <Link
        to="/admin"
        className="mt-2 inline-flex min-h-11 items-center text-small font-semibold text-fg underline underline-offset-4"
      >
        {t.back}
      </Link>
    </div>
  );
}

export default RequireRole;
