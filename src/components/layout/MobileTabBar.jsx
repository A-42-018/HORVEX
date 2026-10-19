import { NavLink, useLocation } from "react-router";
import { Heart, House, LayoutGrid, ShoppingBag, Truck } from "lucide-react";
import { selectCartCount, useCart } from "../../store/cart";
import { selectWishlistCount, useWishlist } from "../../store/wishlist";
import { useUI } from "../../store/ui";
import { strings } from "../../lib/strings";

const ICON = { size: 22, strokeWidth: 1.5, "aria-hidden": true };
const ITEM =
  "relative flex min-h-16 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium uppercase tracking-wider transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

const tone = (active) => (active ? "text-gold" : "text-muted hover:text-fg");

function Count({ value }) {
  if (value < 1) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -right-2 -top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-pill bg-gold px-1 text-badge tracking-normal text-obsidian tabular-nums"
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

function Tab({ to, end, Icon, label, ariaLabel, count = 0, matches }) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={ariaLabel}
      className={({ isActive }) => `${ITEM} ${tone(matches ?? isActive)}`}
    >
      <span className="relative">
        <Icon {...ICON} />
        <Count value={count} />
      </span>
      {label}
    </NavLink>
  );
}

// Bottom tab bar for < lg (roadmap §5.3): Home · Shop · Wishlist · Bag · Track.
// 64px plus the home-indicator inset. Bag opens the cart drawer (it is not a route).
function MobileTabBar() {
  const { pathname } = useLocation();
  const cartCount = useCart(selectCartCount);
  const wishlistCount = useWishlist(selectWishlistCount);
  const cartOpen = useUI((s) => s.cartOpen);
  const openCart = useUI((s) => s.openCart);
  const inShop = /^\/(shop|category|collection|product)(\/|$)/.test(pathname);

  return (
    <nav
      aria-label={strings.tabBar.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-obsidian/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur lg:hidden"
    >
      <div className="grid grid-cols-5">
        <Tab to="/" end Icon={House} label={strings.tabBar.home} />
        <Tab to="/shop" Icon={LayoutGrid} label={strings.tabBar.shop} matches={inShop} />
        <Tab
          to="/wishlist"
          Icon={Heart}
          label={strings.tabBar.wishlist}
          ariaLabel={strings.nav.wishlist(wishlistCount)}
          count={wishlistCount}
        />
        <button
          type="button"
          onClick={openCart}
          aria-label={strings.nav.bag(cartCount)}
          aria-haspopup="dialog"
          className={`${ITEM} ${tone(cartOpen)}`}
        >
          <span className="relative">
            <ShoppingBag {...ICON} />
            <Count value={cartCount} />
          </span>
          {strings.tabBar.bag}
        </button>
        <Tab to="/track-order" Icon={Truck} label={strings.tabBar.track} />
      </div>
    </nav>
  );
}

export default MobileTabBar;
