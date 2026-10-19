import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { ChevronRight } from "lucide-react";
import { Drawer, Skeleton } from "../common";
import { useCategories } from "../../hooks/useCatalog";
import { selectWishlistCount, useWishlist } from "../../store/wishlist";
import { useUI } from "../../store/ui";
import { strings } from "../../lib/strings";

const STRAP_SLUGS = ["chain", "leather"];
const TOP_LEVEL_SLUGS = ["men", "women"];

const PRICE_LINKS = [
  { to: "/shop?max=2999", label: strings.mega.prices.under2999 },
  { to: "/shop?max=4999", label: strings.mega.prices.under4999 },
  { to: "/shop?min=5000", label: strings.mega.prices.over4999 },
];

const HELP_LINKS = [
  { to: "/track-order", label: strings.mobileMenu.trackOrder },
  { to: "/about", label: strings.mobileMenu.about },
  { to: "/contact", label: strings.mobileMenu.contact },
  { to: "/faq", label: strings.mobileMenu.faq },
];

function PrimaryLink({ to, children }) {
  return (
    <Link
      to={to}
      className="flex min-h-12 items-center justify-between border-b border-line text-h3 text-fg transition-colors duration-fast hover:text-brand focus-visible:text-brand"
    >
      {children}
      <ChevronRight size={18} strokeWidth={1.5} aria-hidden="true" className="text-gold" />
    </Link>
  );
}

function SubLink({ to, children, trailing }) {
  return (
    <li>
      <Link
        to={to}
        className="flex min-h-11 items-center justify-between text-small text-fg transition-colors duration-fast hover:text-brand focus-visible:text-brand"
      >
        {children}
        {trailing}
      </Link>
    </li>
  );
}

function Group({ title, children }) {
  return (
    <section className="mt-8">
      <h3 className="text-eyebrow">{title}</h3>
      <ul className="mt-2">{children}</ul>
    </section>
  );
}

// Slide-in navigation for < lg (roadmap §5.3). Reads the same categories as the
// desktop mega menu; closes on route change. Focus trap, ESC and focus return
// come from Drawer/DialogShell.
function MobileMenu() {
  const open = useUI((s) => s.menuOpen);
  const closeAll = useUI((s) => s.closeAll);
  const { pathname, search } = useLocation();
  const wishlistCount = useWishlist(selectWishlistCount);
  const categories = useCategories();

  useEffect(() => {
    closeAll();
  }, [pathname, search, closeAll]);

  // Crossing into the desktop layout leaves a dangling open menu: close it.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => e.matches && closeAll();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [closeAll]);

  const cats = (categories.data ?? []).filter((c) => !TOP_LEVEL_SLUGS.includes(c.slug));
  const straps = cats.filter((c) => STRAP_SLUGS.includes(c.slug));
  const styles = cats.filter((c) => !STRAP_SLUGS.includes(c.slug));
  const hasCategories = styles.length > 0 || straps.length > 0;

  return (
    <Drawer open={open} onClose={closeAll} side="left" title={strings.mobileMenu.title}>
      <nav aria-label={strings.mobileMenu.title}>
        <PrimaryLink to="/category/men">{strings.nav.men}</PrimaryLink>
        <PrimaryLink to="/category/women">{strings.nav.women}</PrimaryLink>
        <PrimaryLink to="/shop">{strings.mobileMenu.shopAll}</PrimaryLink>

        {categories.isPending ? (
          <div className="mt-8 space-y-3" aria-hidden="true">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-28" />
          </div>
        ) : hasCategories ? (
          <>
            {styles.length > 0 && (
              <Group title={strings.mobileMenu.byStyle}>
                {styles.map((c) => (
                  <SubLink key={c.id} to={`/category/${c.slug}`}>
                    {c.name}
                  </SubLink>
                ))}
              </Group>
            )}
            {straps.length > 0 && (
              <Group title={strings.mobileMenu.byStrap}>
                {straps.map((c) => (
                  <SubLink key={c.id} to={`/category/${c.slug}`}>
                    {c.name}
                  </SubLink>
                ))}
              </Group>
            )}
          </>
        ) : (
          <p className="mt-8 text-small text-muted">{strings.mobileMenu.empty}</p>
        )}

        <Group title={strings.mobileMenu.byPrice}>
          {PRICE_LINKS.map((l) => (
            <SubLink key={l.to} to={l.to}>
              {l.label}
            </SubLink>
          ))}
        </Group>

        <Group title={strings.mobileMenu.help}>
          <SubLink
            to="/wishlist"
            trailing={
              wishlistCount > 0 ? (
                <span className="rounded-pill bg-gold px-2 text-badge text-obsidian tabular-nums">{wishlistCount}</span>
              ) : null
            }
          >
            {strings.mobileMenu.wishlist}
          </SubLink>
          {HELP_LINKS.map((l) => (
            <SubLink key={l.to} to={l.to}>
              {l.label}
            </SubLink>
          ))}
        </Group>
      </nav>
    </Drawer>
  );
}

export default MobileMenu;
