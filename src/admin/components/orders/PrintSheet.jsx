import { formatDate, formatPhone, formatTaka } from "../../../lib/format";
import { strings } from "../../../lib/strings";
import { amountToCollect, contactLines, isVoidStatus, lineTotal, unitCount } from "./orderPrint";

const t = strings.admin.orders.detail.print;
const d = strings.admin.orders.detail;

// One A4 sheet. It always uses the ivory (ink-on-light) tokens so it reads the
// same whichever admin theme is on, and prints without needing backgrounds.
const sheet =
  "mx-auto flex w-full max-w-[210mm] flex-col gap-6 bg-white p-5 text-fg sm:p-[12mm] print:max-w-none print:p-0";

function Letterhead({ settings, title, order }) {
  const brand = settings?.brand_name || "WRISTORY";
  return (
    <header className="flex flex-wrap items-start justify-between gap-6 border-b border-fg pb-4">
      <div className="flex flex-col gap-1">
        <p className="font-logo text-h3 tracking-wordmark">{brand}</p>
        {contactLines(settings).map((line) => (
          <p key={line} className="whitespace-pre-line text-small text-muted">
            {line}
          </p>
        ))}
      </div>
      <dl className="flex flex-col gap-1 text-right">
        <dt className="sr-only">{title}</dt>
        <dd className="text-h3">{title}</dd>
        <div className="flex justify-end gap-2 text-small">
          <dt className="text-muted">{t.orderNo}</dt>
          <dd className="font-semibold tabular-nums">{order.order_number}</dd>
        </div>
        <div className="flex justify-end gap-2 text-small">
          <dt className="text-muted">{t.date}</dt>
          <dd className="tabular-nums">{formatDate(order.created_at)}</dd>
        </div>
      </dl>
    </header>
  );
}

function VoidNote({ order }) {
  if (!isVoidStatus(order.status)) return null;
  return (
    <p role="status" className="border border-fg px-3 py-2 text-small font-semibold">
      {t.voidNote(strings.admin.orders.tabs[order.status] ?? order.status)}
    </p>
  );
}

function DeliverTo({ order, label }) {
  return (
    <section aria-label={label} className="flex flex-col gap-1">
      <h2 className="text-badge text-muted">{label}</h2>
      <p className="text-body font-semibold">{order.customer_name}</p>
      <p className="whitespace-pre-line text-small">{order.address}</p>
      <p className="text-small">{order.district}</p>
      <p className="text-small tabular-nums">
        <span className="text-muted">{t.phone}: </span>
        {formatPhone(order.phone)}
      </p>
      {order.email && (
        <p className="break-words text-small">
          <span className="text-muted">{t.email}: </span>
          {order.email}
        </p>
      )}
    </section>
  );
}

function CourierBlock({ order }) {
  return (
    <section className="flex flex-col gap-1 text-small">
      <h2 className="text-badge text-muted">{t.payment}</h2>
      <p>{d.totals.cod}</p>
      {order.courier && (
        <p>
          <span className="text-muted">{d.courier}: </span>
          {order.courier}
        </p>
      )}
      {order.tracking_id && (
        <p className="break-words tabular-nums">
          <span className="text-muted">{d.tracking}: </span>
          {order.tracking_id}
        </p>
      )}
    </section>
  );
}

function CustomerNote({ order }) {
  if (!order.customer_note) return null;
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-badge text-muted">{t.customerNote}</h2>
      <p className="whitespace-pre-line text-small">{order.customer_note}</p>
    </section>
  );
}

const th = "border-b border-fg px-2 py-2 text-left text-badge text-muted";
const td = "border-b border-line px-2 py-2 align-top text-small";

function ItemName({ item }) {
  return (
    <>
      <p className="font-semibold">{item.name_snapshot}</p>
      {item.variant_snapshot && <p className="text-muted">{item.variant_snapshot}</p>}
    </>
  );
}

export function InvoiceSheet({ order, settings }) {
  const due = amountToCollect(order);
  const row = (label, value, strong = false) => (
    <div
      className={`flex justify-between gap-6 ${strong ? "border-t border-fg pt-2 text-body font-semibold" : "text-small"}`}
    >
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );

  return (
    <article aria-label={t.docTitle.invoice(order.order_number)} className={sheet}>
      <Letterhead settings={settings} title={t.invoice} order={order} />
      <VoidNote order={order} />
      <div className="grid gap-6 sm:grid-cols-2">
        <DeliverTo order={order} label={t.billTo} />
        <CourierBlock order={order} />
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[32rem] border-collapse print:min-w-0">
          <caption className="sr-only">{d.items}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${th} w-8`}>
                {t.columns.no}
              </th>
              <th scope="col" className={th}>
                {t.columns.item}
              </th>
              <th scope="col" className={`${th} text-right`}>
                {t.columns.qty}
              </th>
              <th scope="col" className={`${th} text-right`}>
                {t.columns.unit}
              </th>
              <th scope="col" className={`${th} text-right`}>
                {t.columns.total}
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id} className="break-inside-avoid">
                <td className={`${td} tabular-nums text-muted`}>{index + 1}</td>
                <td className={td}>
                  <ItemName item={item} />
                </td>
                <td className={`${td} text-right tabular-nums`}>{item.qty}</td>
                <td className={`${td} text-right tabular-nums`}>{formatTaka(item.unit_price)}</td>
                <td className={`${td} text-right tabular-nums`}>{formatTaka(lineTotal(item))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-6 break-inside-avoid sm:flex-row sm:items-start sm:justify-between">
        <div className="sm:max-w-[55%]">
          <CustomerNote order={order} />
        </div>
        <dl className="flex w-full flex-col gap-2 sm:w-72">
          {row(d.totals.subtotal, formatTaka(order.subtotal))}
          {order.discount > 0 &&
            row(order.coupon_code ? d.totals.coupon(order.coupon_code) : d.totals.discount, `−${formatTaka(order.discount)}`)}
          {row(d.totals.delivery, order.delivery_charge > 0 ? formatTaka(order.delivery_charge) : d.totals.free)}
          {row(d.totals.total, formatTaka(order.total), true)}
          {due > 0 && row(t.amountDue, formatTaka(due))}
        </dl>
      </div>

      <footer className="mt-4 border-t border-line pt-4 text-center text-small text-muted">
        <p>{settings?.footer_text?.trim() || t.thanks(settings?.brand_name || "WRISTORY")}</p>
      </footer>
    </article>
  );
}

export function PackingSheet({ order, settings }) {
  const due = amountToCollect(order);
  return (
    <article aria-label={t.docTitle.packing(order.order_number)} className={sheet}>
      <Letterhead settings={settings} title={t.packing} order={order} />
      <VoidNote order={order} />
      <div className="grid gap-6 sm:grid-cols-2">
        <DeliverTo order={order} label={t.deliverTo} />
        <div className="flex flex-col gap-4">
          <CourierBlock order={order} />
          <section className="flex flex-col gap-1 border border-fg p-3">
            <h2 className="text-badge text-muted">{t.collect}</h2>
            <p className="text-h3 tabular-nums">{due > 0 ? formatTaka(due) : t.nothingToCollect}</p>
          </section>
        </div>
      </div>

      <CustomerNote order={order} />

      <div className="flex flex-col gap-2">
        <p className="text-small font-semibold">{t.units(unitCount(order.items))}</p>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse">
            <caption className="sr-only">{d.items}</caption>
            <thead>
              <tr>
                <th scope="col" className={`${th} w-16`}>
                  {t.columns.packed}
                </th>
                <th scope="col" className={th}>
                  {t.columns.item}
                </th>
                <th scope="col" className={`${th} w-16 text-right`}>
                  {t.columns.qty}
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="break-inside-avoid">
                  <td className={td}>
                    <span aria-hidden="true" className="inline-block h-5 w-5 border border-fg" />
                  </td>
                  <td className={td}>
                    <div className="flex items-start gap-3">
                      {item.image_snapshot && (
                        <img
                          src={item.image_snapshot}
                          alt=""
                          className="h-16 w-12 shrink-0 rounded-card border border-line object-cover"
                        />
                      )}
                      <div>
                        <ItemName item={item} />
                      </div>
                    </div>
                  </td>
                  <td className={`${td} text-right text-h3 tabular-nums`}>{item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid gap-6 break-inside-avoid sm:grid-cols-2">
        {[t.packedBy, t.checkedBy].map((label) => (
          <div key={label} className="flex flex-col gap-1">
            <div className="h-8 border-b border-fg" />
            <p className="text-small text-muted">{label}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
