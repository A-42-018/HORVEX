import { Route, Routes } from "react-router";
import AdminLayout from "./layout/AdminLayout";
import AdminPlaceholder from "./pages/AdminPlaceholder";

// Everything under /admin lives behind this module, which the router loads as
// a separate chunk, so storefront visitors never download admin code.
const PAGES = [
  ["orders", "Orders", 11],
  ["orders/:orderId", "Order detail", 11],
  ["products", "Products", 10],
  ["products/new", "New product", 10],
  ["products/:productId", "Edit product", 10],
  ["categories", "Categories & collections", 10],
  ["homepage", "Homepage builder", 12],
  ["content", "Content", 12],
  ["coupons", "Coupons", 12],
  ["delivery", "Delivery zones", 12],
  ["customers", "Customers", 11],
  ["reviews", "Reviews", 12],
  ["settings", "Settings", 12],
  ["users", "Users & roles", 12],
];

function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminPlaceholder title="Admin login" phase={9} />} />
      <Route element={<AdminLayout />}>
        <Route index element={<AdminPlaceholder title="Dashboard" phase={9} />} />
        {PAGES.map(([path, title, phase]) => (
          <Route key={path} path={path} element={<AdminPlaceholder title={title} phase={phase} />} />
        ))}
        <Route path="*" element={<AdminPlaceholder title="Page not found" phase={9} />} />
      </Route>
    </Routes>
  );
}

export default AdminApp;
