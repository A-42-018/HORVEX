import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import AuthProvider from "./auth/AuthProvider";
import RequireAdmin from "./auth/RequireAdmin";
import RequireRole from "./auth/RequireRole";
import AdminLayout from "./layout/AdminLayout";
import AdminStatus from "./components/AdminStatus";
import Login from "./pages/Login";
import { strings } from "./strings";

// Everything under /admin lives behind this module, which the router loads as
// a separate chunk, so storefront visitors never download admin code. Each page
// is its own chunk too (AdminLayout's <Suspense> shows the wait).
const Activity = lazy(() => import("./pages/Activity"));
const AdminPlaceholder = lazy(() => import("./pages/AdminPlaceholder"));
const Categories = lazy(() => import("./pages/Categories"));
const Collections = lazy(() => import("./pages/Collections"));
const Content = lazy(() => import("./pages/Content"));
const Coupons = lazy(() => import("./pages/Coupons"));
const Customers = lazy(() => import("./pages/Customers"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Delivery = lazy(() => import("./pages/Delivery"));
const Homepage = lazy(() => import("./pages/Homepage"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const OrderPrint = lazy(() => import("./pages/OrderPrint"));
const Orders = lazy(() => import("./pages/Orders"));
const ProductEditor = lazy(() => import("./pages/ProductEditor"));
const Products = lazy(() => import("./pages/Products"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Settings = lazy(() => import("./pages/Settings"));
const Users = lazy(() => import("./pages/Users"));

function AdminApp() {
  return (
    <AuthProvider>
      {/* Only the print view waits here; pages inside the layout wait in its own <Suspense>. */}
      <Suspense fallback={<AdminStatus loading title={strings.admin.loadingPage} />}>
        <Routes>
          <Route path="login" element={<Login />} />
          {/* Print view: signed in, but without the admin sidebar and top bar. */}
          <Route
            path="orders/:orderId/print"
            element={
              <RequireAdmin>
                <RequireRole minRole="staff">
                  <OrderPrint />
                </RequireRole>
              </RequireAdmin>
            }
          />
          <Route
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Dashboard />} />
            <Route
              path="products"
              element={
                <RequireRole minRole="manager">
                  <Products />
                </RequireRole>
              }
            />
            <Route
              path="categories"
              element={
                <RequireRole minRole="manager">
                  <Categories />
                </RequireRole>
              }
            />
            <Route
              path="homepage"
              element={
                <RequireRole minRole="manager">
                  <Homepage />
                </RequireRole>
              }
            />
            <Route
              path="content"
              element={
                <RequireRole minRole="manager">
                  <Content />
                </RequireRole>
              }
            />
            <Route
              path="coupons"
              element={
                <RequireRole minRole="manager">
                  <Coupons />
                </RequireRole>
              }
            />
            <Route
              path="delivery"
              element={
                <RequireRole minRole="manager">
                  <Delivery />
                </RequireRole>
              }
            />
            <Route
              path="collections"
              element={
                <RequireRole minRole="manager">
                  <Collections />
                </RequireRole>
              }
            />
            <Route
              path="orders"
              element={
                <RequireRole minRole="staff">
                  <Orders />
                </RequireRole>
              }
            />
            <Route
              path="settings"
              element={
                <RequireRole minRole="owner">
                  <Settings />
                </RequireRole>
              }
            />
            <Route
              path="users"
              element={
                <RequireRole minRole="owner">
                  <Users />
                </RequireRole>
              }
            />
            <Route
              path="activity"
              element={
                <RequireRole minRole="manager">
                  <Activity />
                </RequireRole>
              }
            />
            <Route
              path="reviews"
              element={
                <RequireRole minRole="manager">
                  <Reviews />
                </RequireRole>
              }
            />
            <Route
              path="customers"
              element={
                <RequireRole minRole="staff">
                  <Customers />
                </RequireRole>
              }
            />
            <Route
              path="orders/:orderId"
              element={
                <RequireRole minRole="staff">
                  <OrderDetail />
                </RequireRole>
              }
            />
            {["products/new", "products/:productId"].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <RequireRole minRole="manager">
                    <ProductEditor />
                  </RequireRole>
                }
              />
            ))}
            <Route path="*" element={<AdminPlaceholder title="Page not found" phase="B21" />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default AdminApp;
