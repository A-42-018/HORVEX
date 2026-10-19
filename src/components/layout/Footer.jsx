import { Link } from "react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "../common";
import { InstagramIcon } from "./icons";
import { useSiteSettings } from "../../hooks/useContent";
import { formatPhone, normalizePhone } from "../../lib/format";
import { strings } from "../../lib/strings";

const t = strings.footer;

function FacebookIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M14 9h2.5V6.5H14C12 6.5 11 7.7 11 9.5V11H9v2.5h2V21h2.5v-7.5H16l.5-2.5H13.5v-1c0-.6.3-1 1-1Z" />
    </svg>
  );
}

function TikTokIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M15.5 3h2.2c.2 1.7 1.3 3.1 3.3 3.4v2.3c-1.3 0-2.5-.4-3.5-1.1v6.1c0 3-2.4 5.3-5.4 5.3S6.7 17.7 6.7 14.7c0-2.9 2.3-5.2 5.2-5.3v2.4a2.8 2.8 0 1 0 2 2.7V3Z" />
    </svg>
  );
}

function YouTubeIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="2.5" y="6" width="19" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.97L2 22l5.2-1.36A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-2.9-.4-4.1-1.1l-.3-.18-3.08.8.82-3-.2-.31a8.1 8.1 0 1 1 6.86 3.8Zm4.45-6.07c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.47-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.1 3.64.57.25 1.02.4 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

// Keys read from site_settings.socials (jsonb). Anything that isn't an http(s) URL is ignored.
const SOCIALS = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
];

const SHOP_LINKS = [
  { to: "/shop", label: t.shopLinks.all },
  { to: "/category/men", label: t.shopLinks.men },
  { to: "/category/women", label: t.shopLinks.women },
  { to: "/category/couple", label: t.shopLinks.couple },
];

const HELP_LINKS = [
  { to: "/track-order", label: t.helpLinks.track },
  { to: "/faq", label: t.helpLinks.faq },
  { to: "/contact", label: t.helpLinks.contact },
  { to: "/policy/shipping", label: t.helpLinks.shipping },
  { to: "/policy/returns-replacement", label: t.helpLinks.returns },
  { to: "/policy/warranty", label: t.helpLinks.warranty },
];

const LEGAL_LINKS = [
  { to: "/policy/privacy", label: t.legal.privacy },
  { to: "/policy/terms", label: t.legal.terms },
];

const linkClass =
  "inline-flex min-h-11 items-center text-small text-muted transition-colors duration-fast hover:text-fg focus-visible:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:min-h-0";

const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(String(value ?? "").trim());
const clean = (value) => String(value ?? "").trim();

function LinkList({ heading, links }) {
  return (
    <nav aria-label={heading}>
      <h2 className="text-eyebrow text-brand">{heading}</h2>
      <ul className="mt-4 flex flex-col lg:gap-3">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link to={to} className={linkClass}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ContactRow({ icon: Icon, href, children, external }) {
  const body = (
    <>
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </>
  );
  const cls = "flex items-start gap-3 text-small text-muted";
  if (!href) return <li className={cls}>{body}</li>;
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`${cls} min-h-11 items-center transition-colors duration-fast hover:text-fg focus-visible:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:min-h-0`}
      >
        {body}
      </a>
    </li>
  );
}

function Footer() {
  const { data } = useSiteSettings();
  const brand = clean(data?.brand_name) || "HORVEX";
  const blurb = clean(data?.footer_text) || t.fallbackText;

  const phoneRaw = clean(data?.contact_phone);
  const phoneNormal = normalizePhone(phoneRaw);
  const phoneHref = phoneRaw ? `tel:${phoneNormal ?? phoneRaw.replace(/[^\d+]/g, "")}` : null;
  const whatsapp = normalizePhone(data?.whatsapp_number);
  const email = clean(data?.contact_email);
  const address = clean(data?.address);
  const socials = SOCIALS.filter(({ key }) => isHttpUrl(data?.socials?.[key]));
  const couriers = (data?.courier_partners ?? []).map(clean).filter(Boolean);
  const hasContact = Boolean(phoneRaw || whatsapp || email || address);

  return (
    <footer className="section-dark border-t border-line">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4 lg:pr-8">
            <Link
              to="/"
              aria-label={strings.nav.home}
              className="inline-flex min-h-11 items-center rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span className="font-logo text-body uppercase tracking-wordmark text-fg">{brand}</span>
            </Link>
            <p className="mt-4 max-w-sm text-small text-muted">{blurb}</p>

            {socials.length > 0 && (
              <div className="mt-6">
                <h2 className="sr-only">{t.social}</h2>
                <ul className="flex flex-wrap items-center gap-2">
                  {socials.map(({ key, label, Icon }) => (
                    <li key={key}>
                      <a
                        href={clean(data.socials[key])}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-pill border border-line text-fg transition-colors duration-fast hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        <Icon />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <LinkList heading={t.shop} links={SHOP_LINKS} />
          </div>

          <div className="lg:col-span-3">
            <LinkList heading={t.help} links={HELP_LINKS} />
          </div>

          {hasContact && (
            <div className="lg:col-span-3">
              <h2 className="text-eyebrow text-brand">{t.contact}</h2>
              <ul className="mt-4 flex flex-col lg:gap-3">
                {phoneRaw && (
                  <ContactRow icon={Phone} href={phoneHref}>
                    {phoneNormal ? formatPhone(phoneNormal) : phoneRaw}
                  </ContactRow>
                )}
                {whatsapp && (
                  <ContactRow icon={WhatsAppIcon} href={`https://wa.me/${whatsapp.slice(1)}`} external>
                    {t.whatsapp} {formatPhone(whatsapp)}
                  </ContactRow>
                )}
                {email && (
                  <ContactRow icon={Mail} href={`mailto:${email}`}>
                    {email}
                  </ContactRow>
                )}
                {address && <ContactRow icon={MapPin}>{address}</ContactRow>}
              </ul>
            </div>
          )}
        </div>

        {/* Delivery partners + payment */}
        <div className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
          {couriers.length > 0 && (
            <div>
              <h2 className="text-eyebrow text-brand">{t.couriers}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {couriers.map((name) => (
                  <li key={name} className="rounded-control border border-line px-3 py-2 text-small text-fg">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h2 className="text-eyebrow text-brand">{t.payment}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {t.paymentMethods.map((name) => (
                <li key={name} className="rounded-control border border-line px-3 py-2 text-small text-fg">
                  {name}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-small text-muted">{t.paymentNote}</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col-reverse gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-small text-muted">
            © {new Date().getFullYear()} {brand}. {t.rights}
          </p>
          <ul className="flex flex-wrap gap-x-6">
            {LEGAL_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
