import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { Button, Container, IconButton, Input, SectionHeading, Select } from "../components/common";
import { FreeDeliveryBar, QtyStepper } from "../components/cart/CartParts";
import { useDeliveryZones } from "../hooks/useContent";
import { useOrderQuote } from "../hooks/useOrders";
import { MAX_LINES, selectCartCount, selectCartEstimate, useCart } from "../store/cart";
import { formatTaka } from "../lib/format";
import { strings } from "../lib/strings";

const t = strings.cart;
const copy = t.page;
const COUPON_ERRORS = new Set(["invalid_coupon", "coupon_min_order"]);

function Line({ line }) {
  const remove = useCart((s) => s.remove);
  return (
    <li className="flex gap-4 py-6 sm:gap-6">
      <Link to={`/product/${line.slug}`} className="block h-32 w-24 shrink-0 overflow-hidden rounded-card bg-raised sm:h-40 sm:w-32">
        {line.image && <img src={line.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/product/${line.slug}`} className="block text-body text-fg hover:text-brand focus-visible:text-brand">
              {line.name}
            </Link>
            {line.variantName && <p className="text-small text-muted">{line.variantName}</p>}
            <p className="mt-1 text-small tabular-nums text-muted">{copy.each(formatTaka(line.price))}</p>
          </div>
          <IconButton label={t.remove(line.name)} variant="ghost" className="-mr-2 -mt-2" onClick={() => remove(line.key)}>
            <Trash2 size={18} strokeWidth={1.5} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <QtyStepper line={line} />
          <p className="text-price font-semibold tabular-nums text-brand">{formatTaka(line.price * line.qty)}</p>
        </div>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <ShoppingBag size={48} strokeWidth={1} aria-hidden="true" className="text-gold" />
      <h2 className="mt-4 text-h3">{t.emptyTitle}</h2>
      <p className="mt-2 text-small text-muted">{t.emptyBody}</p>
      <Button as={Link} to="/shop" className="mt-6">
        {t.continueShopping}
      </Button>
    </div>
  );
}

function SummaryRow({ label, children, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "text-body text-fg" : "text-small text-muted"}>{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-price text-brand" : "text-small text-fg"}`}>{children}</dd>
    </div>
  );
}

function Cart() {
  const lines = useCart((s) => s.lines);
  const count = useCart(selectCartCount);
  const estimate = useCart(selectCartEstimate);
  const { data: zones } = useDeliveryZones();

  const [chosenZone, setChosenZone] = useState("");
  const [draft, setDraft] = useState("");
  const [applied, setApplied] = useState("");
  const [couponError, setCouponError] = useState(null);

  // Default to the first active zone until the shopper picks one.
  const zoneId = chosenZone || (zones?.[0]?.id != null ? String(zones[0].id) : "");
  const quoteQuery = useOrderQuote({ lines, zoneId, couponCode: applied });
  const quote = lines.length > 0 ? quoteQuery.data : undefined;
  const error = quoteQuery.error;

  // A rejected coupon is dropped so the totals fall back to the no-coupon quote.
  useEffect(() => {
    if (error && COUPON_ERRORS.has(error.code)) {
      setCouponError({ code: error.code, details: error.details });
      setApplied("");
    }
  }, [error]);

  const applyCoupon = (event) => {
    event.preventDefault();
    const code = draft.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);
    setApplied(code);
    setDraft("");
  };

  const removeCoupon = () => {
    setApplied("");
    setCouponError(null);
  };

  const zone = zones?.find((z) => String(z.id) === zoneId);
  const subtotal = quote?.subtotal ?? estimate;
  const discount = quote?.discount ?? 0;
  const delivery = quote ? quote.delivery_charge : null;
  const total = quote?.total ?? null;
  const eta = quote?.eta_text || zone?.eta_text;

  const minOrder = Number(couponError?.details);
  const couponMessage = couponError
    ? couponError.code === "coupon_min_order"
      ? t.quoteErrors.coupon_min_order(minOrder > 0 ? formatTaka(minOrder) : "")
      : t.quoteErrors.invalid_coupon
    : null;
  const quoteProblem = error && !COUPON_ERRORS.has(error.code) ? (t.quoteErrors[error.code] ?? t.quoteErrors.fallback) : null;

  let body;
  if (lines.length === 0) {
    body = <EmptyState />;
  } else {
    body = (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-16">
        <section aria-label={copy.linesLabel}>
          <p className="text-small text-muted" aria-live="polite">
            {copy.items(count)}
            {lines.length >= MAX_LINES && ` · ${strings.product.bagFull}`}
          </p>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {lines.map((line) => (
              <Line key={line.key} line={line} />
            ))}
          </ul>
          <Button as={Link} to="/shop" variant="link" className="mt-4">
            {t.continueShopping}
          </Button>
        </section>

        <aside aria-label={copy.summary} className="space-y-5 rounded-card border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="text-h3">{copy.summary}</h2>

          <FreeDeliveryBar amount={subtotal - discount} className="!bg-raised" />

          {zones?.length > 0 && (
            <Select
              label={copy.zoneLabel}
              placeholder={null}
              value={zoneId}
              onChange={(e) => setChosenZone(e.target.value)}
              options={zones.map((z) => ({ value: String(z.id), label: copy.zoneOption(z.name, formatTaka(z.charge)) }))}
            />
          )}

          {applied ? (
            <div className="flex items-center justify-between gap-3 rounded-control border border-line px-4 py-2">
              <p className="text-small text-fg">{copy.couponApplied(applied)}</p>
              <IconButton label={copy.couponRemove} variant="ghost" onClick={removeCoupon}>
                <X size={16} strokeWidth={1.5} aria-hidden="true" />
              </IconButton>
            </div>
          ) : (
            <form onSubmit={applyCoupon} className="flex items-start gap-3">
              <Input
                label={copy.couponLabel}
                className="min-w-0 flex-1"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                error={couponMessage}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
              />
              <Button type="submit" variant="secondary" className="h-14" disabled={!draft.trim() || !zoneId}>
                {copy.couponApply}
              </Button>
            </form>
          )}

          <dl className="space-y-3 border-t border-line pt-5" aria-busy={quoteQuery.isFetching || undefined}>
            <SummaryRow label={t.subtotal}>{formatTaka(subtotal)}</SummaryRow>
            {discount > 0 && <SummaryRow label={copy.discount}>−{formatTaka(discount)}</SummaryRow>}
            {delivery !== null && (
              <SummaryRow label={copy.delivery}>{delivery === 0 ? copy.free : formatTaka(delivery)}</SummaryRow>
            )}
            <SummaryRow label={copy.total} strong>
              {formatTaka(total ?? subtotal - discount)}
            </SummaryRow>
          </dl>

          {total === null && <p className="text-small text-muted">{copy.estimateNote}</p>}
          {eta && <p className="text-small text-muted">{copy.eta(eta)}</p>}
          {quoteProblem && (
            <p className="text-small text-danger" role="alert">
              {quoteProblem}
            </p>
          )}

          <div className="grid gap-3">
            <Button as={Link} to="/checkout" state={{ zoneId, couponCode: applied || null }} size="lg">
              {t.checkout}
            </Button>
            <p className="text-center text-small text-muted">{copy.cod}</p>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <Container className="py-section-sm lg:py-section">
      <title>{`${t.title} | HORVEX`}</title>
      <SectionHeading as="h1" eyebrow={copy.eyebrow} title={copy.title} align="left" className="mb-10" />
      {body}
    </Container>
  );
}

export default Cart;
