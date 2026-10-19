import { useSiteSettings } from "../../hooks/useContent";
import { normalizePhone } from "../../lib/format";
import { strings } from "../../lib/strings";

function WhatsAppGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.97L2 22l5.2-1.36A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-2.9-.4-4.1-1.1l-.3-.18-3.08.8.82-3-.2-.31a8.1 8.1 0 1 1 6.86 3.8Zm4.45-6.07c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.8-.2-.47-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.1 3.64.57.25 1.02.4 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

// Floating "chat with us" button. The number comes from site settings; with no
// valid number nothing renders. On < lg it floats above the tab bar (64px +
// safe-area inset + gap) so the two never overlap; on desktop it sits bottom right.
function WhatsAppFab() {
  const { data } = useSiteSettings();
  const phone = normalizePhone(data?.whatsapp_number);
  if (!phone) return null;

  const href = `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(strings.whatsapp.message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={strings.whatsapp.label}
      className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-obsidian shadow-lg transition-transform duration-base hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 lg:right-6"
    >
      <WhatsAppGlyph className="h-7 w-7" />
    </a>
  );
}

export default WhatsAppFab;
