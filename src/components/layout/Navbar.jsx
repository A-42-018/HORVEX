import { useEffect, useRef, useState } from "react";
import { Container } from "../common";
import { SearchIcon, UserIcon, HeartIcon, BagIcon, MenuIcon, CloseIcon } from "./icons";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Shop", href: "#shop" },
  { label: "Categories", href: "#categories" },
  { label: "New Arrivals", href: "#new-arrivals" },
  { label: "About", href: "#about" },
];

function IconButton({ label, children, className = "", ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors duration-200 hover:bg-bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Logo() {
  return (
    <a
      href="#home"
      className="flex items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      aria-label="Storefront home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-small font-bold text-white">
        S
      </span>
      <span className="text-body sm:text-h3 font-semibold tracking-tight text-ink whitespace-nowrap">
        Storefront
      </span>
    </a>
  );
}

function Navbar({ cartCount = 0 }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setScrolled(window.scrollY > 8);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-300 ${
        scrolled ? "border-border bg-white/90 backdrop-blur-md shadow-sm" : "border-transparent bg-bg"
      }`}
    >
      <Container>
        <nav
          className="flex h-16 items-center justify-between gap-4 lg:h-20"
          aria-label="Primary"
        >
          {/* Mobile: menu button + logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <IconButton
              label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
              ref={menuButtonRef}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
            <Logo />
          </div>

          {/* Desktop: logo left */}
          <div className="hidden lg:flex lg:items-center">
            <Logo />
          </div>

          {/* Desktop: center links */}
          <ul className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-nav text-ink-secondary transition-colors duration-200 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right: icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <IconButton label="Search" className="hidden sm:inline-flex">
              <SearchIcon />
            </IconButton>
            <IconButton label="Account" className="hidden lg:inline-flex">
              <UserIcon />
            </IconButton>
            <IconButton label="Wishlist" className="hidden lg:inline-flex">
              <HeartIcon />
            </IconButton>
            <IconButton label="Search" className="sm:hidden">
              <SearchIcon />
            </IconButton>
            <IconButton label={`Cart, ${cartCount} items`}>
              <BagIcon />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sale text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </IconButton>
          </div>
        </nav>
      </Container>

      {/* Mobile menu panel */}
      <div
        className={`grid overflow-hidden bg-white transition-[grid-template-rows] duration-300 ease-in-out lg:hidden ${
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <Container>
            <ul className="flex flex-col divide-y divide-border border-t border-border py-2">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-nav text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4 border-t border-border py-4">
              <a href="#account" className="flex items-center gap-2 text-nav text-ink-secondary">
                <UserIcon className="h-5 w-5" /> Account
              </a>
              <a href="#wishlist" className="flex items-center gap-2 text-nav text-ink-secondary">
                <HeartIcon className="h-5 w-5" /> Wishlist
              </a>
            </div>
          </Container>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
