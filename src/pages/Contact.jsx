import { Link } from "react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container, SectionHeading } from "../components/common";
import { WhatsAppGlyph } from "../components/layout/WhatsAppFab";
import ContactForm from "../components/contact/ContactForm";
import { useSiteSettings } from "../hooks/useContent";
import { formatPhone, normalizePhone } from "../lib/format";
import { strings } from "../lib/strings";

const t = strings.contact;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const cardClass =
  "flex min-h-11 items-start gap-4 rounded-card border border-line bg-surface p-5 transition-colors duration-fast";
const linkCardClass = `${cardClass} hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`;

function Card({ icon: Icon, label, value, href, external = false }) {
  const body = (
    <>
      <Icon size={22} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
      <span className="min-w-0">
        <span className="block text-eyebrow text-muted">{label}</span>
        <span className="mt-1 block break-words text-body text-fg">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a href={href} className={linkCardClass} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {body}
    </a>
  ) : (
    <div className={cardClass}>{body}</div>
  );
}

function Contact() {
  const { data: settings } = useSiteSettings();
  const phone = normalizePhone(settings?.contact_phone);
  const whatsapp = normalizePhone(settings?.whatsapp_number);
  const email = EMAIL.test(settings?.contact_email ?? "") ? settings.contact_email.trim() : null;
  const address = settings?.address?.trim() || null;
  const hasDetails = Boolean(phone || whatsapp || email || address);

  return (
    <Container className="py-section-sm lg:py-section">
      <title>{`${t.eyebrow} | WRISTORY`}</title>
      <SectionHeading as="h1" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />

      <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <div className="space-y-4">
          {phone && <Card icon={Phone} label={t.call} value={formatPhone(phone)} href={`tel:${phone}`} />}
          {whatsapp && (
            <Card
              icon={WhatsAppGlyph}
              label={t.whatsapp}
              value={formatPhone(whatsapp)}
              href={`https://wa.me/${whatsapp.slice(1)}?text=${encodeURIComponent(strings.whatsapp.message)}`}
              external
            />
          )}
          {email && <Card icon={Mail} label={t.email} value={email} href={`mailto:${email}`} />}
          {address && <Card icon={MapPin} label={t.visit} value={address} />}
          {!hasDetails && <p className="text-body text-muted">{t.noDetails}</p>}
          <p className="pt-2 text-small text-muted">
            {t.track}{" "}
            <Link
              to="/track-order"
              className="text-brand underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {t.trackLink}
            </Link>
          </p>
        </div>

        <section aria-labelledby="contact-form-title" className="relative rounded-card border border-line bg-surface p-5 sm:p-8">
          <h2 id="contact-form-title" className="mb-6 text-h3 text-fg">
            {t.formTitle}
          </h2>
          <ContactForm />
        </section>
      </div>
    </Container>
  );
}

export default Contact;
