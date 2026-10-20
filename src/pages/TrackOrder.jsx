import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { PackageSearch } from "lucide-react";
import { Button, Container, Input, SectionHeading, Skeleton } from "../components/common";
import OrderTimeline from "../components/track/OrderTimeline";
import { WhatsAppGlyph } from "../components/layout/WhatsAppFab";
import { useSiteSettings } from "../hooks/useContent";
import { useTrackOrder } from "../hooks/useOrders";
import { formatDate, formatTaka, isValidPhone, normalizePhone } from "../lib/format";
import { strings } from "../lib/strings";

const t = strings.trackOrder;

function Row({ label, children, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "text-body text-fg" : "text-small text-muted"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-price text-brand" : "text-small text-fg"}`}>{children}</dd>
    </div>
  );
}

function TrackOrder() {
  const [params] = useSearchParams();
  const { data: settings } = useSiteSettings();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  // What was last submitted; the lookup only runs for this pair.
  const [query, setQuery] = useState({ phone: "", orderNumber: "" });

  const { data: order, isFetching, isError } = useTrackOrder(query);
  const searched = Boolean(query.phone && query.orderNumber);

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!orderNumber.trim()) next.order = t.errors.order;
    if (!isValidPhone(phone)) next.phone = strings.form.invalidPhone;
    setErrors(next);
    if (Object.keys(next).length) return;
    setQuery({ phone: normalizePhone(phone), orderNumber: orderNumber.trim() });
  };

  const whatsapp = normalizePhone(settings?.whatsapp_number);
  const waHref =
    whatsapp && order
      ? `https://wa.me/${whatsapp.slice(1)}?text=${encodeURIComponent(t.whatsappMessage(order.order_number))}`
      : null;

  return (
    <Container className="py-section-sm lg:py-section">
      <title>{`${t.eyebrow} | HORVEX`}</title>
      <div className="mx-auto max-w-2xl">
        <SectionHeading as="h1" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} className="text-center" />

        <form onSubmit={submit} noValidate className="mt-10 space-y-4">
          <Input
            label={t.orderNumber}
            hint={t.orderNumberHint}
            error={errors.order}
            autoCapitalize="characters"
            autoComplete="off"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
          <Input
            label={t.phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            error={errors.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button type="submit" size="lg" loading={isFetching} className="w-full">
            {t.submit}
          </Button>
        </form>

        <div aria-live="polite" className="mt-10">
          {isFetching && !order && <Skeleton className="h-64 w-full" />}

          {searched && !isFetching && isError && (
            <p role="alert" className="text-body text-danger">
              {t.failed}
            </p>
          )}

          {searched && !isFetching && !isError && order === null && (
            <div className="flex flex-col items-center gap-4 text-center">
              <PackageSearch size={40} strokeWidth={1} aria-hidden="true" className="text-gold" />
              <p className="text-body text-muted">{t.notFound}</p>
            </div>
          )}

          {order && (
            <div className="space-y-10">
              <section className="rounded-card border border-line bg-surface p-5">
                <p className="text-eyebrow text-muted">{t.orderNumber}</p>
                <p className="mt-1 font-display text-h2 text-brand">{order.order_number}</p>
                <p className="mt-1 text-small text-muted">{t.placedOn(formatDate(order.placed_at))}</p>
                <div className="mt-6">
                  <OrderTimeline status={order.status} history={order.history}>
                    {(order.courier || order.tracking_id) && (
                      <dl className="mt-2 space-y-1 text-small">
                        {order.courier && (
                          <div className="flex gap-2">
                            <dt className="text-muted">{t.courier}</dt>
                            <dd className="text-fg">{order.courier}</dd>
                          </div>
                        )}
                        {order.tracking_id && (
                          <div className="flex gap-2">
                            <dt className="text-muted">{t.trackingId}</dt>
                            <dd className="break-all tabular-nums text-fg">{order.tracking_id}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </OrderTimeline>
                </div>
                {order.eta_text && order.status !== "delivered" && order.status !== "cancelled" && order.status !== "returned" && (
                  <p className="mt-6 text-small text-muted">{t.eta(order.eta_text)}</p>
                )}
              </section>

              <section aria-label={t.itemsTitle} className="rounded-card border border-line bg-surface p-5">
                <h2 className="text-h4">{t.itemsTitle}</h2>
                <ul className="mt-4 divide-y divide-line">
                  {order.items.map((l) => (
                    <li key={`${l.name}:${l.variant_name ?? ""}`} className="flex items-center gap-4 py-3">
                      {l.image && <img src={l.image} alt="" className="h-16 w-16 rounded-control object-cover" loading="lazy" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body text-fg">{l.name}</p>
                        <p className="text-small text-muted">{[l.variant_name, t.qty(l.qty)].filter(Boolean).join(" · ")}</p>
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
                <p className="mt-4 text-small text-muted">{t.codNote}</p>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row">
                {waHref && (
                  <Button as="a" href={waHref} target="_blank" rel="noopener noreferrer" className="sm:flex-1">
                    <WhatsAppGlyph className="h-5 w-5" /> {t.whatsapp}
                  </Button>
                )}
                <Button as={Link} to="/shop" variant="link" className="sm:flex-1">
                  {strings.orderSuccess.continueShopping}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

export default TrackOrder;
