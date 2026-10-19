import { Container } from "../common";
import { InstagramIcon } from "./icons";

function FacebookIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M14 9h2.5V6.5H14C12 6.5 11 7.7 11 9.5V11H9v2.5h2V21h2.5v-7.5H16l.5-2.5H13.5v-1c0-.6.3-1 1-1Z" />
    </svg>
  );
}

function TikTokIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M15.5 3h2.2c.2 1.7 1.3 3.1 3.3 3.4v2.3c-1.3 0-2.5-.4-3.5-1.1v6.1c0 3-2.4 5.3-5.4 5.3S6.7 17.7 6.7 14.7c0-2.9 2.3-5.2 5.2-5.3v2.4a2.8 2.8 0 1 0 2 2.7V3Z" />
    </svg>
  );
}

function YouTubeIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "TikTok", href: "#", Icon: TikTokIcon },
  { label: "YouTube", href: "#", Icon: YouTubeIcon },
];

const LINK_COLUMNS = [
  {
    heading: "Shop",
    links: ["All Products", "New Arrivals", "Best Sellers", "Sale"],
  },
  {
    heading: "Support",
    links: ["Contact Us", "Shipping", "Returns", "FAQ"],
  },
  {
    heading: "Company",
    links: ["About", "Our Story", "Careers", "Privacy Policy"],
  },
];

const BOTTOM_LINKS = ["Privacy Policy", "Terms", "Refund Policy"];

function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-5 lg:gap-x-6">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-4 lg:col-span-1 lg:pr-4">
            <a
              href="#home"
              className="flex items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              aria-label="Storefront home"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-small font-bold text-white">
                S
              </span>
              <span className="text-h3 font-semibold tracking-tight text-ink">Storefront</span>
            </a>
            <p className="text-small text-ink-secondary">
              Thoughtfully designed products made for modern, everyday living.
            </p>
          </div>

          {/* Shop / Support / Company */}
          {LINK_COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading} className="flex flex-col gap-4">
              <h3 className="text-small font-semibold text-ink">{col.heading}</h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((label) => (
                  <li key={label}>
                    <a
                      href="#"
                      className="text-small text-ink-secondary transition-colors duration-200 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Social */}
          <div className="col-span-2 flex flex-col gap-4 sm:col-span-1 lg:col-span-1">
            <h3 className="text-small font-semibold text-ink">Social</h3>
            <ul className="flex items-center gap-2">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-ink transition-colors duration-200 hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col-reverse items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
          <p className="text-small text-ink-secondary">© 2026 Brand Name</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {BOTTOM_LINKS.map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className="text-small text-ink-secondary transition-colors duration-200 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
