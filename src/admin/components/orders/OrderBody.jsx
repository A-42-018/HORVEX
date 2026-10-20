import { MessageCircle, Phone } from "lucide-react";
import { Button, Card } from "../../../components/common";
import { formatPhone, formatTaka } from "../../../lib/format";
import { strings } from "../../../lib/strings";
import CustomerStanding from "../customers/CustomerStanding";
import { telHref, whatsappHref } from "./orderActionsForm";

const t = strings.admin.orders.detail;

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-badge text-muted">{label}</dt>
      <dd className="break-words text-small text-fg">{children}</dd>
    </div>
  );
}

function ContactButtons({ order }) {
  const call = telHref(order.phone);
  const chat = whatsappHref(order.phone, t.contact.message(order.customer_name, order.order_number));
  if (!call) return <p className="text-small text-muted">{t.contact.invalid}</p>;
  return (
    <div className="flex flex-wrap gap-3">
      <Button as="a" href={`tel:${call}`} size="sm" aria-label={t.contact.callLabel(order.customer_name)}>
        <Phone aria-hidden="true" size={18} strokeWidth={1.5} />
        {t.contact.call}
      </Button>
      <Button
        as="a"
        href={chat}
        target="_blank"
        rel="noopener noreferrer"
        size="sm"
        variant="secondary"
        aria-label={t.contact.whatsappLabel(order.customer_name)}
      >
        <MessageCircle aria-hidden="true" size={18} strokeWidth={1.5} />
        {t.contact.whatsapp}
      </Button>
    </div>
  );
}

export function CustomerCard({ order }) {
  return (
    <Card as="section" aria-labelledby="order-customer-title" className="flex flex-col gap-4 p-5">
      <h2 id="order-customer-title" className="text-h3 text-fg">
        {t.customer}
      </h2>
      <ContactButtons order={order} />
      <CustomerStanding phone={order.phone} name={order.customer_name} />
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label={t.customer}>{order.customer_name}</Field>
        <Field label={t.phone}>
          <a href={`tel:${order.phone}`} className="inline-flex min-h-11 items-center tabular-nums hover:text-brand">
            {formatPhone(order.phone)}
          </a>
        </Field>
        {order.email && <Field label={t.email}>{order.email}</Field>}
        <Field label={t.district}>{order.district}</Field>
        <div className="sm:col-span-2">
          <Field label={t.address}>{order.address}</Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t.customerNote}>{order.customer_note || <span className="text-muted">{t.noNote}</span>}</Field>
        </div>
      </dl>
    </Card>
  );
}

export function ItemsCard({ order }) {
  const { items } = order;
  return (
    <Card as="section" aria-labelledby="order-items-title" className="flex flex-col gap-4 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="order-items-title" className="text-h3 text-fg">
          {t.items}
        </h2>
        <span className="text-small text-muted">{t.itemsCount(items.reduce((sum, i) => sum + i.qty, 0))}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-small text-muted">{t.noItems}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-card bg-raised">
                {item.image_snapshot && (
                  <img src={item.image_snapshot} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-small font-semibold text-fg">{item.name_snapshot}</p>
                {item.variant_snapshot && <p className="text-small text-muted">{item.variant_snapshot}</p>}
                {!item.product_id && <p className="text-small text-muted">{t.removed}</p>}
                <p className="text-small text-muted tabular-nums">
                  {t.qty(item.qty)} · {t.each(formatTaka(item.unit_price))}
                </p>
              </div>
              <p className="shrink-0 text-small font-semibold tabular-nums text-fg">{formatTaka(item.unit_price * item.qty)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function TotalsCard({ order }) {
  const row = (label, value, strong = false) => (
    <div className={`flex items-center justify-between gap-3 ${strong ? "border-t border-line pt-3 text-body font-semibold text-fg" : "text-small text-muted"}`}>
      <dt>{label}</dt>
      <dd className={`tabular-nums ${strong ? "" : "text-fg"}`}>{value}</dd>
    </div>
  );
  return (
    <Card as="section" aria-labelledby="order-totals-title" className="flex flex-col gap-3 p-5">
      <h2 id="order-totals-title" className="text-h3 text-fg">
        {t.totals.title}
      </h2>
      <dl className="flex flex-col gap-2">
        {row(t.totals.subtotal, formatTaka(order.subtotal))}
        {order.discount > 0 && row(order.coupon_code ? t.totals.coupon(order.coupon_code) : t.totals.discount, `−${formatTaka(order.discount)}`)}
        {row(t.totals.delivery, order.delivery_charge > 0 ? formatTaka(order.delivery_charge) : t.totals.free)}
        {row(t.totals.total, formatTaka(order.total), true)}
        {row(t.totals.payment, t.totals.cod)}
      </dl>
      {(order.courier || order.tracking_id) && (
        <dl className="flex flex-col gap-2 border-t border-line pt-3">
          {order.courier && row(t.courier, order.courier)}
          {order.tracking_id && row(t.tracking, order.tracking_id)}
        </dl>
      )}
    </Card>
  );
}
