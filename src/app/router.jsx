import { createBrowserRouter } from "react-router";
import StoreLayout from "../components/layout/StoreLayout";
import Home from "../pages/Home";
import { routeChunks } from "./routeChunks";

// Every page but home is its own chunk (roadmap §13); the router loads it
// before committing the navigation, so there's no loading flash between pages.
const page = (load, name = "default") => ({
  HydrateFallback: () => null,
  lazy: async () => ({ Component: (await load())[name] }),
});

// Route map from roadmap §5.
export const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "shop", ...page(routeChunks.listing, "Shop") },
      { path: "category/:slug", ...page(routeChunks.listing, "CategoryListing") },
      { path: "collection/:slug", ...page(routeChunks.listing, "CollectionListing") },
      { path: "product/:slug", ...page(routeChunks.product) },
      { path: "wishlist", ...page(routeChunks.wishlist) },
      { path: "cart", ...page(routeChunks.cart) },
      { path: "checkout", ...page(routeChunks.checkout) },
      { path: "order/success/:orderId", ...page(routeChunks.orderSuccess) },
      { path: "track-order", ...page(routeChunks.trackOrder) },
      { path: "about", ...page(routeChunks.about) },
      { path: "contact", ...page(routeChunks.contact) },
      { path: "faq", ...page(routeChunks.faq) },
      { path: "policy/:slug", ...page(routeChunks.policy) },
      { path: "account", ...page(routeChunks.account, "AccountHome") },
      { path: "account/login", ...page(routeChunks.account, "Login") },
      { path: "account/register", ...page(routeChunks.account, "Register") },
      { path: "account/forgot-password", ...page(routeChunks.account, "ForgotPassword") },
      { path: "account/reset-password", ...page(routeChunks.account, "ResetPassword") },
      { path: "*", ...page(routeChunks.notFound) },
    ],
  },
  {
    path: "admin/*",
    HydrateFallback: () => null,
    lazy: async () => ({ Component: (await import("../admin/AdminApp")).default }),
  },
]);
