import { Outlet, ScrollRestoration } from "react-router";
import AnnouncementBar from "./AnnouncementBar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SearchOverlay from "./SearchOverlay";
import MobileMenu from "./MobileMenu";
import CartDrawer from "./CartDrawer";
import MobileTabBar from "./MobileTabBar";
import WhatsAppFab from "./WhatsAppFab";
import Toaster from "./Toaster";

// Shell for every storefront route: skip link, header, routed page, footer.
// The base is dark; template sections that are still light carry their own
// backgrounds until block B rebuilds them.
function StoreLayout() {
  return (
    <div className="min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:rounded focus-visible:bg-ink focus-visible:px-4 focus-visible:py-2 focus-visible:text-button focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Skip to main content
      </a>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
      <SearchOverlay />
      <MobileMenu />
      <CartDrawer />
      <MobileTabBar />
      <WhatsAppFab />
      <Toaster />
      <ScrollRestoration />
    </div>
  );
}

export default StoreLayout;
