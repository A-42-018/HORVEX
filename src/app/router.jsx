import { createBrowserRouter } from "react-router";
import StoreLayout from "../components/layout/StoreLayout";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import { CategoryListing, CollectionListing, Shop } from "../pages/Listing";
import Product from "../pages/Product";
import Wishlist from "../pages/Wishlist";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import OrderSuccess from "../pages/OrderSuccess";
import TrackOrder from "../pages/TrackOrder";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Faq from "../pages/Faq";
import Policy from "../pages/Policy";

// Route map from roadmap §5.
export const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "shop", element: <Shop /> },
      { path: "category/:slug", element: <CategoryListing /> },
      { path: "collection/:slug", element: <CollectionListing /> },
      { path: "product/:slug", element: <Product /> },
      { path: "wishlist", element: <Wishlist /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "order/success/:orderId", element: <OrderSuccess /> },
      { path: "track-order", element: <TrackOrder /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "faq", element: <Faq /> },
      { path: "policy/:slug", element: <Policy /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "admin/*",
    HydrateFallback: () => null,
    lazy: async () => ({ Component: (await import("../admin/AdminApp")).default }),
  },
  // Primitive reference page. The condition is static, so production builds drop it.
  ...(import.meta.env.DEV
    ? [
        {
          path: "style-guide",
          HydrateFallback: () => null,
          lazy: async () => ({ Component: (await import("../pages/StyleGuide")).default }),
        },
      ]
    : []),
]);
