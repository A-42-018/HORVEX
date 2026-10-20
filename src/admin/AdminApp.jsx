import { Route, Routes } from "react-router";
import AuthProvider from "./auth/AuthProvider";
import RequireAdmin from "./auth/RequireAdmin";
import RequireRole from "./auth/RequireRole";
import AdminLayout from "./layout/AdminLayout";
import Activity from "./pages/Activity";
import AdminPlaceholder from "./pages/AdminPlaceholder";
import Categories from "./pages/Categories";
import Collections from "./pages/Collections";
import Content from "./pages/Content";
import Coupons from "./pages/Coupons";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Delivery from "./pages/Delivery";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import OrderDetail from "./pages/OrderDetail";
import OrderPrint from "./pages/OrderPrint";
import Orders from "./pages/Orders";
import ProductEditor from "./pages/ProductEditor";
import Products from "./pages/Products";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";
import Users from "./pages/Users";

// Everything under /admin lives behind this module, which the router loads as
// a separate chunk, so storefront visitors never download admin code.

function AdminApp() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default AdminApp;
