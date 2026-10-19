import { Outlet, ScrollRestoration } from "react-router";
import AnnouncementBar from "./AnnouncementBar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { selectCartCount, useCart } from "../../store/cart";

// Shell for every storefront route: skip link, header, routed page, footer.
// section-ivory keeps the light template sections readable on the dark base
// until block B rebuilds the header, footer and pages.
function StoreLayout() {
  const cartCount = useCart(selectCartCount);

  return (
    <div className="section-ivory min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:rounded focus-visible:bg-ink focus-visible:px-4 focus-visible:py-2 focus-visible:text-button focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Skip to main content
      </a>
      <AnnouncementBar />
      <Navbar cartCount={cartCount} />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}

export default StoreLayout;
