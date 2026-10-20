import { HandCoins, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { useDeliveryZones } from "../../hooks/useContent";
import { formatDeliveryBy } from "../../lib/format";
import { strings } from "../../lib/strings";

// Latest day in an ETA like "1–2 days" / "2-4 days"; null if there's no number.
function etaDays(text) {
  const nums = String(text ?? "").match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : null;
}

function DeliveryEstimate() {
  const { data: zones } = useDeliveryZones();
  const zone = zones?.[0];
  if (!zone) return null;

  const days = etaDays(zone.eta_text);
  const t = strings.product.delivery;
  const text = days
    ? t.dhaka(zone.name, formatDeliveryBy(new Date(Date.now() + days * 86_400_000)))
    : t.fallback(zone.name, zone.eta_text);

  return (
    <li className="flex items-center gap-3 text-small text-fg" aria-label={t.label}>
      <Truck aria-hidden="true" size={20} strokeWidth={1.5} className="shrink-0 text-brand" />
      {text}
    </li>
  );
}

const ITEMS = [
  { icon: HandCoins, key: "cod" },
  { icon: PackageCheck, key: "check" },
  { icon: ShieldCheck, key: "replace" },
];

function TrustRow() {
  return (
    <ul aria-label={strings.product.trust.label} className="flex flex-col gap-3 border-t border-line pt-5">
      {ITEMS.map(({ icon: Icon, key }) => (
        <li key={key} className="flex items-center gap-3 text-small text-fg">
          <Icon aria-hidden="true" size={20} strokeWidth={1.5} className="shrink-0 text-brand" />
          {strings.product.trust[key]}
        </li>
      ))}
      <DeliveryEstimate />
    </ul>
  );
}

export default TrustRow;
