import { NavLink, Outlet } from "react-router";

// Admin shell skeleton. Real sidebar/topbar, auth guard and mobile layout
// arrive in Phase 9; this only proves the lazy admin chunk and nested routes.
const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/homepage", label: "Homepage" },
  { to: "/admin/content", label: "Content" },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/delivery", label: "Delivery" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/users", label: "Users" },
];

function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-secondary text-ink md:flex-row">
      <title>Admin | HORVEX</title>
      <nav aria-label="Admin" className="border-b border-border bg-bg md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <p className="px-5 py-4 text-small font-semibold uppercase tracking-wider text-ink">HORVEX Admin</p>
        <ul className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {ADMIN_NAV.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `block whitespace-nowrap rounded-sm px-3 py-2 text-small focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink ${
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
      <main className="flex-1 p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
