import { Route, Routes } from "react-router";
import AuthProvider from "./auth/AuthProvider";
import RequireAdmin from "./auth/RequireAdmin";
import RequireRole from "./auth/RequireRole";
import AdminLayout from "./layout/AdminLayout";
import AdminPlaceholder from "./pages/AdminPlaceholder";
import Login from "./pages/Login";

// Everything under /admin lives behind this module, which the router loads as
// a separate chunk, so storefront visitors never download admin code.
// [path, title, phase, minRole]: staff = orders + customers (roadmap §10).
const PAGES = [
  ["orders", "Orders", "B25", "staff"],
  ["orders/:orderId", "Order detail", "B26", "staff"],
  ["products", "Products", "B22", "manager"],
  ["products/new", "New product", "B22", "manager"],
  ["products/:productId", "Edit product", "B23", "manager"],
  ["categories", "Categories & collections", "B24", "manager"],
  ["homepage", "Homepage builder", "B27", "manager"],
  ["content", "Content", "B28", "manager"],
  ["coupons", "Coupons", "B29", "manager"],
  ["delivery", "Delivery zones", "B29", "manager"],
  ["customers", "Customers", "B26", "staff"],
  ["reviews", "Reviews", "B28", "manager"],
  ["settings", "Settings", "B29", "owner"],
  ["users", "Users & roles", "B29", "owner"],
];

function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminPlaceholder title="Dashboard" phase="B21" />} />
          {PAGES.map(([path, title, phase, minRole]) => (
            <Route
              key={path}
              path={path}
              element={
                <RequireRole minRole={minRole}>
                  <AdminPlaceholder title={title} phase={phase} />
                </RequireRole>
              }
            />
          ))}
          <Route path="*" element={<AdminPlaceholder title="Page not found" phase="B21" />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default AdminApp;
