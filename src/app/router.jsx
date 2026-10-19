import { createBrowserRouter } from "react-router";
import StoreLayout from "../components/layout/StoreLayout";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import PagePlaceholder from "../pages/PagePlaceholder";

// Route map from roadmap §5. Placeholders are swapped for real pages phase by phase.
const placeholder = (path, title, phase) => ({ path, element: <PagePlaceholder title={title} phase={phase} /> });

export const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { index: true, element: <Home /> },
      placeholder("shop", "Shop all watches", 5),
      placeholder("category/:slug", "Category", 5),
      placeholder("collection/:slug", "Collection", 5),
      placeholder("product/:slug", "Product", 6),
      placeholder("wishlist", "Wishlist", 7),
      placeholder("cart", "Your bag", 7),
      placeholder("checkout", "Checkout", 8),
      placeholder("order/success/:orderId", "Order placed", 8),
      placeholder("track-order", "Track your order", 8),
      placeholder("about", "About HORVEX", 15),
      placeholder("contact", "Contact", 15),
      placeholder("faq", "FAQ", 15),
      placeholder("policy/:slug", "Policy", 12),
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "admin/*",
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
