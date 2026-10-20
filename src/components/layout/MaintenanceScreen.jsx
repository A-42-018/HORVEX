import { Phone } from "lucide-react";
import { formatPhone, normalizePhone } from "../../lib/format";
import { strings } from "../../lib/strings";
import { WhatsAppGlyph } from "./WhatsAppFab";

const t = strings.maintenance;
const linkClass =
  "inline-flex min-h-11 items-center gap-2 rounded-control border border-line px-4 text-small font-semibold text-fg transition-colors duration-fast hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";

/** Shown instead of the whole store while site_settings.maintenance_mode is on. Contact details only if set. */
function MaintenanceScreen({ settings }) {
  const phone = normalizePhone(settings?.contact_phone);
  const whatsapp = normalizePhone(settings?.whatsapp_number);
  const brand = settings?.brand_name?.trim() || "HORVEX";

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-6 py-16 text-center">
      <title>{`${t.title} | ${brand}`}</title>
      <p className="font-display text-h3 uppercase tracking-[0.32em] text-fg">{brand}</p>
      <h1 className="text-h2 text-fg">{t.title}</h1>
      <p className="max-w-md text-body text-muted">{t.body}</p>
      {(phone || whatsapp) && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-small text-muted">{t.contact}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {phone && (
              <a href={`tel:${phone}`} className={linkClass}>
                <Phone aria-hidden="true" size={18} strokeWidth={1.5} />
                {t.call(formatPhone(phone))}
              </a>
            )}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp.slice(1)}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <WhatsAppGlyph className="h-[18px] w-[18px]" />
                {t.whatsapp}
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default MaintenanceScreen;
