import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Heart, Menu, Search, ShoppingBag } from "lucide-react";
import { Container, IconButton } from "../common";
import MegaMenu from "./MegaMenu";
import { useHeaderScroll } from "../../hooks/useHeaderScroll";
import { selectCartCount, selectCartEstimate, useCart } from "../../store/cart";
import { selectWishlistCount, useWishlist } from "../../store/wishlist";
import { useUI } from "../../store/ui";
import { formatTaka } from "../../lib/format";
import { strings } from "../../lib/strings";

const ICON = { size: 20, strokeWidth: 1.5 };

const NAV_LINKS = [
  { to: "/category/men", label: strings.nav.men },
  { to: "/category/women", label: strings.nav.women },
];

function Counter({ value, bag = false }) {
  if (value < 1) return null;
  return (
    <span
      aria-hidden="true"
      data-bag-count={bag || undefined}
      className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-pill bg-gold px-1 text-badge tracking-normal text-obsidian tabular-nums"
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

function Wordmark() {
  return (
    <Link
      to="/"
      aria-label={strings.nav.home}
      className="group flex items-center gap-4 rounded-control px-2 py-3"
    >
      <span aria-hidden="true" className="hidden h-px w-8 bg-gold/60 transition-[width] duration-base group-hover:w-12 lg:block" />
      <span className="font-logo text-body uppercase tracking-wordmark text-fg">WRISTORY</span>
      <span aria-hidden="true" className="hidden h-px w-8 bg-gold/60 transition-[width] duration-base group-hover:w-12 lg:block" />
    </Link>
  );
}

// Mobile: [☰] WRISTORY [Search] [Bag] (menu = MobileMenu drawer). Desktop (lg+): [Men] [Women] [Collections ▾ mega menu]  — WRISTORY —  [Search] [Wishlist] [Bag].
// Transparent over the top of the home page, solid after 80px, hides on scroll
// down. Below lg it is a plain solid bar that stays visible.
function Navbar() {
  const { pathname } = useLocation();
  const { scrolled, hidden } = useHeaderScroll();
  const cartCount = useCart(selectCartCount);
  const cartEstimate = useCart(selectCartEstimate);
  const wishlistCount = useWishlist(selectWishlistCount);
  const openCart = useUI((s) => s.openCart);
  const openSearch = useUI((s) => s.openSearch);
  const openMenu = useUI((s) => s.openMenu);

  const isHome = pathname === "/";
  const [megaOpen, setMegaOpen] = useState(false);
  const solid = scrolled || !isHome || megaOpen;

  return (
    <header
      className={`sticky top-0 z-50 transition-transform duration-slow ease-out-expo focus-within:!translate-y-0 ${
        hidden ? "lg:-translate-y-full" : ""
      } ${isHome ? "lg:-mb-20" : ""}`}
    >
      {/* Background layers fade with opacity only: solid obsidian + blur, or a soft top scrim. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 border-b border-line bg-obsidian/90 backdrop-blur-md transition-opacity duration-base ${
          solid ? "opacity-100" : "opacity-100 lg:opacity-0"
        }`}
      />
      <div
        aria-hidden="true"
        className={`absolute inset-0 hidden bg-gradient-to-b from-obsidian/70 to-transparent transition-opacity duration-base lg:block ${
          solid ? "opacity-0" : "opacity-100"
        }`}
      />

      <Container className="relative">
        <nav
          aria-label={strings.nav.label}
          className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 lg:h-20"
        >
          <div className="flex items-center lg:hidden">
            <IconButton label={strings.nav.menu} variant="ghost" className="-ml-2 border-0" onClick={openMenu}>
              <Menu {...ICON} />
            </IconButton>
          </div>

          <ul className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `relative inline-flex min-h-11 items-center text-button transition-colors duration-fast after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-base hover:text-brand focus-visible:text-brand ${
                      isActive ? "text-brand after:scale-x-100" : "text-fg after:scale-x-0 hover:after:scale-x-100"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <MegaMenu onOpenChange={setMegaOpen} headerHidden={hidden} />
            </li>
          </ul>

          <div className="lg:justify-self-center">
            <Wordmark />
          </div>

          <div className="flex items-center justify-end gap-1">
            <IconButton label={strings.nav.search} variant="ghost" className="border-0" onClick={openSearch}>
              <Search {...ICON} />
            </IconButton>
            <IconButton
              as={Link}
              to="/wishlist"
              label={strings.nav.wishlist(wishlistCount)}
              variant="ghost"
              className="hidden border-0 lg:inline-flex"
            >
              <Heart {...ICON} />
              <Counter value={wishlistCount} />
            </IconButton>
            <button
              type="button"
              aria-label={strings.nav.bag(cartCount)}
              onClick={openCart}
              data-bag-target
              className="relative inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-pill px-3 text-fg transition-colors duration-fast hover:bg-fg/10 active:scale-95"
            >
              <span className="relative">
                <ShoppingBag {...ICON} />
                <Counter value={cartCount} bag />
              </span>
              {cartCount > 0 && (
                <span className="hidden text-small font-semibold tabular-nums xl:inline">{formatTaka(cartEstimate)}</span>
              )}
            </button>
          </div>
        </nav>
      </Container>
    </header>
  );
}

export default Navbar;
