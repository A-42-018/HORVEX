import { Outlet, ScrollRestoration } from "react-router";
import { useEffect } from "react";
import { useSiteSettings } from "../../hooks/useContent";
import { useUI } from "../../store/ui";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SearchOverlay from "./SearchOverlay";
import MobileMenu from "./MobileMenu";
import CartDrawer from "./CartDrawer";
import MobileTabBar from "./MobileTabBar";
import WhatsAppFab from "./WhatsAppFab";
import Toaster from "./Toaster";
import MaintenanceScreen from "./MaintenanceScreen";

// Shell for every storefront route: skip link, header, routed page, footer.
// The base is dark; template sections that are still light carry their own
// backgrounds until block B rebuilds them.
function StoreLayout() {
  const { data: settings } = useSiteSettings();
  const faviconUrl = settings?.favicon_url?.trim();
  // Favicon from settings: point the existing <link rel="icon"> at it (the file in index.html stays the fallback).
  useEffect(() => {
    if (!/^https?:\/\//i.test(faviconUrl ?? "")) return undefined;
    const link = document.querySelector('link[rel~="icon"]');
    if (!link) return undefined;
    const original = { href: link.getAttribute("href"), type: link.getAttribute("type") };
    link.removeAttribute("type");
    link.setAttribute("href", faviconUrl);
    return () => {
      link.setAttribute("href", original.href ?? "");
      if (original.type) link.setAttribute("type", original.type);
    };
  }, [faviconUrl]);

  // The PDP sticky buy bar (~4.8rem) sits above the tab bar; pad so it never covers the footer.
  const stickyBar = useUI((s) => s.stickyBar);
  // Closed for maintenance: only the notice (settings load fast; on a load error the store stays open).
  if (settings?.maintenance_mode === true) return <MaintenanceScreen settings={settings} />;
  return (
    <div
      className={`min-h-screen lg:pb-0 ${
        stickyBar ? "pb-[calc(9rem+env(safe-area-inset-bottom,0px))]" : "pb-[calc(4rem+env(safe-area-inset-bottom,0px))]"
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:rounded focus-visible:bg-ink focus-visible:px-4 focus-visible:py-2 focus-visible:text-button focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Skip to main content
      </a>
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
