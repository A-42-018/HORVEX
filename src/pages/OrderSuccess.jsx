import { Link, useLocation, useParams } from "react-router";
import { Check, PackageSearch } from "lucide-react";
import { Button, Container, SectionHeading } from "../components/common";
import { WhatsAppGlyph } from "../components/layout/WhatsAppFab";
import { useSiteSettings } from "../hooks/useContent";
import { loadLastOrder } from "../lib/lastOrder";
import { formatTaka, normalizePhone } from "../lib/format";
import { strings } from "../lib/strings";

const t = strings.orderSuccess;

function Row({ label, children, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "text-body text-fg" : "text-small text-muted"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-price text-brand" : "text-small text-fg"}`}>{children}</dd>
    </div>
  );
}

function OrderSuccess() {
  const { orderId } = useParams();
  const { state } = useLocation();
  const { data: settings } = useSiteSettings();
  const order = state?.order?.order_id === orderId ? state.order : loadLastOrder(orderId);

  const whatsapp = normalizePhone(settings?.whatsapp_number);

  if (!order) {
    return (
      <Container className="flex flex-col items-center gap-6 py-section-sm text-center lg:py-section">
        <title>{`${t.missingTitle} | WRISTORY`}</title>
        <PackageSearch size={48} strokeWidth={1} aria-hidden="true" className="text-gold" />
        <SectionHeading as="h1" title={t.missingTitle} subtitle={t.missingBody} />
        <div className="flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/track-order">
            {t.trackOrder}
          </Button>
          <Button as={Link} to="/shop" variant="secondary">
            {t.continueShopping}
          </Button>
        </div>
      </Container>
    );
  }

  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.slice(1)}?text=${encodeURIComponent(t.whatsappMessage(order.order_number))}`
    : null;

  return (
    <Container className="py-section-sm lg:py-section">
      <title>{`${t.eyebrow} ${order.order_number} | WRISTORY`}</title>
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Static gold ring + check; the draw animation arrives in C2. */}
          <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold text-gold">
            <Check size={36} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <SectionHeading
            as="h1"
            eyebrow={t.eyebrow}
            title={t.title}
            subtitle={t.intro(order.customer_name)}
            className="mt-6"
          />
          <p className="mt-6 text-eyebrow text-muted">{t.orderNumber}</p>
          <p className="mt-1 font-display text-h2 text-brand" aria-live="polite">
            {order.order_number}
          </p>
        </div>

        <section aria-label={t.summaryTitle} className="mt-10 rounded-card border border-line bg-surface p-5">
          <h2 className="text-h4">{t.summaryTitle}</h2>
          <ul aria-label={t.linesLabel} className="mt-4 divide-y divide-line">
            {(order.lines ?? []).map((l) => (
              <li key={`${l.product_id}:${l.variant_id ?? ""}`} className="flex items-center gap-4 py-3">
                {l.image && <img src={l.image} alt="" className="h-16 w-16 rounded-control object-cover" loading="lazy" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body text-fg">{l.name}</p>
                  <p className="text-small text-muted">
                    {[l.variant_name, t.qty(l.qty)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="text-small tabular-nums text-fg">{formatTaka(l.unit_price * l.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4">
            <Row label={t.subtotal}>{formatTaka(order.subtotal)}</Row>
            {order.discount > 0 && <Row label={t.discount}>{formatTaka(-order.discount)}</Row>}
            <Row label={t.delivery}>{order.delivery_charge > 0 ? formatTaka(order.delivery_charge) : t.free}</Row>
            <Row label={t.total} strong>
              {formatTaka(order.total)}
            </Row>
          </dl>
          <p className="mt-4 text-small text-muted">
            {t.codNote}
            {order.eta_text ? ` · ${t.eta(order.eta_text)}` : ""}
          </p>
        </section>

        <section aria-labelledby="next-title" className="mt-10">
          <h2 id="next-title" className="text-h4">
            {t.nextTitle}
          </h2>
          <ol className="mt-4 space-y-4">
            {strings.howToOrder.steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold text-small text-gold">
                  {i + 1}
                </span>
                <div>
                  <p className="text-body text-fg">{step.title}</p>
                  <p className="text-small text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {waHref && (
            <Button as="a" href={waHref} target="_blank" rel="noopener noreferrer" className="sm:flex-1">
              <WhatsAppGlyph className="h-5 w-5" /> {t.whatsapp}
            </Button>
          )}
          <Button as={Link} to={`/track-order?order=${encodeURIComponent(order.order_number)}`} variant="secondary" className="sm:flex-1">
            {t.trackOrder}
          </Button>
          <Button as={Link} to="/shop" variant="link" className="sm:flex-1">
            {t.continueShopping}
          </Button>
        </div>
      </div>
    </Container>
  );
}

export default OrderSuccess;
