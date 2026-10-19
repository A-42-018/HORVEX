import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { LogOut } from "lucide-react";
import { strings } from "../../lib/strings";
import { useAuth } from "../auth/authContext";
import { hasRole } from "../auth/roles";

// Admin shell skeleton. The real sidebar/topbar and mobile bottom bar arrive in
// B21; this adds the signed-in user, sign-out and a role-filtered nav.
const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", end: true, minRole: "staff" },
  { to: "/admin/orders", label: "Orders", minRole: "staff" },
  { to: "/admin/products", label: "Products", minRole: "manager" },
  { to: "/admin/categories", label: "Categories", minRole: "manager" },
  { to: "/admin/homepage", label: "Homepage", minRole: "manager" },
  { to: "/admin/content", label: "Content", minRole: "manager" },
  { to: "/admin/coupons", label: "Coupons", minRole: "manager" },
  { to: "/admin/delivery", label: "Delivery", minRole: "manager" },
  { to: "/admin/customers", label: "Customers", minRole: "staff" },
  { to: "/admin/reviews", label: "Reviews", minRole: "manager" },
  { to: "/admin/settings", label: "Settings", minRole: "owner" },
  { to: "/admin/users", label: "Users", minRole: "owner" },
];

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink";

function AdminLayout() {
  const { profile, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const nav = ADMIN_NAV.filter((item) => hasRole(profile.role, item.minRole));

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // The local session is cleared even when the server call fails.
      setSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-secondary text-ink md:flex-row">
      <title>Admin | HORVEX</title>
      <nav aria-label="Admin" className="border-b border-border bg-bg md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <p className="px-5 py-4 text-small font-semibold uppercase tracking-wider text-ink">HORVEX Admin</p>
        <ul className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {nav.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-11 items-center whitespace-nowrap rounded-sm px-3 text-small ${focusRing} ${
                    isActive ? "bg-ink text-white" : "text-ink-secondary hover:bg-bg-secondary hover:text-ink"
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-border bg-bg px-6 py-2 md:px-10">
          <p className="min-w-0 truncate text-small text-ink-secondary">
            <span className="font-semibold text-ink">{profile.name}</span> · {strings.admin.roles[profile.role]}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm px-3 text-small font-semibold text-ink hover:bg-bg-secondary disabled:opacity-50 ${focusRing}`}
          >
            <LogOut aria-hidden="true" size={18} strokeWidth={1.5} />
            {strings.admin.signOut}
          </button>
        </header>
        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
