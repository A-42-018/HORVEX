import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ShoppingBag } from "lucide-react";
import { Button, Container, SectionHeading, Skeleton } from "../components/common";
import { CheckoutForm, OrderSummary } from "../components/checkout";
import { useDeliveryZones } from "../hooks/useContent";
import { useOrderQuote, usePlaceOrder } from "../hooks/useOrders";
import { selectCartEstimate, useCart } from "../store/cart";
import { useUI } from "../store/ui";
import { formatTaka } from "../lib/format";
import { saveLastOrder } from "../lib/lastOrder";
import { EVENTS, track } from "../lib/analytics";
import { strings } from "../lib/strings";

const t = strings.checkout;
const FORM_ID = "checkout-form";
const COUPON_ERRORS = new Set(["invalid_coupon", "coupon_min_order"]);

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <ShoppingBag size={48} strokeWidth={1} aria-hidden="true" className="text-gold" />
      <h2 className="mt-4 text-h3">{strings.cart.emptyTitle}</h2>
      <p className="mt-2 text-small text-muted">{strings.cart.emptyBody}</p>
      <Button as={Link} to="/shop" className="mt-6">
        {strings.cart.continueShopping}
      </Button>
    </div>
  );
}

// Everything that needs a zone, so it only mounts once zones have loaded.
function CheckoutBody({ zones, lines, state }) {
  const estimate = useCart(selectCartEstimate);
  const setStickyBar = useUI((s) => s.setStickyBar);
  const [zoneId, setZoneId] = useState("");
  const [applied, setApplied] = useState(() => String(state?.couponCode ?? "").trim().toUpperCase());
  const [couponError, setCouponError] = useState(null);
  const [placeError, setPlaceError] = useState(null);
  const navigate = useNavigate();
  const placeOrder = usePlaceOrder();
  const clearCart = useCart((s) => s.clear);

  const quoteQuery = useOrderQuote({ lines, zoneId, couponCode: applied });
  const quote = quoteQuery.data;
  const error = quoteQuery.error;

  // A rejected coupon is dropped so totals fall back to the no-coupon quote.
  useEffect(() => {
    if (error && COUPON_ERRORS.has(error.code)) {
      setCouponError({ code: error.code, details: error.details });
      setApplied("");
    }
  }, [error]);

  // Lift the WhatsApp button and pad the page for the sticky confirm bar (< lg).
  useEffect(() => {
    setStickyBar(true);
    return () => setStickyBar(false);
  }, [setStickyBar]);

  const zone = zones.find((z) => String(z.id) === zoneId);
  const discount = quote?.discount ?? 0;
  const total = quote?.total ?? Math.max(estimate - discount, 0);
  const minOrder = Number(couponError?.details);
  const couponMessage = couponError
    ? couponError.code === "coupon_min_order"
      ? strings.cart.quoteErrors.coupon_min_order(minOrder > 0 ? formatTaka(minOrder) : "")
      : strings.cart.quoteErrors.invalid_coupon
    : null;
  const quoteBlocked = Boolean(error) && !COUPON_ERRORS.has(error.code);
  const problem = quoteBlocked ? (strings.cart.quoteErrors[error.code] ?? strings.cart.quoteErrors.fallback) : null;

  const totals = {
    quote,
    estimate,
    discount,
    delivery: quote ? quote.delivery_charge : null,
    total,
    eta: quote?.eta_text || zone?.eta_text,
    problem,
    fetching: quoteQuery.isFetching,
    ready: Boolean(zoneId),
  };
  const coupon = {
    applied,
    message: couponMessage,
    onApply: (code) => {
      setCouponError(null);
      setApplied(code);
    },
    onRemove: () => {
      setApplied("");
      setCouponError(null);
    },
  };

  const submit = (values) => {
    if (placeOrder.isPending) return;
    setPlaceError(null);
    placeOrder.mutate(
      {
        lines,
        zoneId: values.zoneId,
        couponCode: applied,
        name: values.name,
        phone: values.phone,
        address: values.address,
        district: values.district,
        email: values.email,
        note: values.note,
        website: values.website,
      },
      {
        onSuccess: (order) => {
          saveLastOrder(order);
          track(EVENTS.purchase, {
            transaction_id: order.order_number,
            value: order.total,
            currency: "BDT",
            shipping: order.delivery_charge,
            coupon: order.coupon_code ?? undefined,
            items: order.lines.map((l) => ({
              item_id: l.product_id,
              item_name: l.name,
              item_variant: l.variant_name ?? undefined,
              price: l.unit_price,
              quantity: l.qty,
            })),
          });
          navigate(`/order/success/${order.order_id}`, { replace: true, state: { order } });
          clearCart();
        },
        onError: (err) => setPlaceError(err),
      },
    );
  };
  const placeMessage = placeError
    ? placeError.code === "coupon_min_order"
      ? strings.cart.quoteErrors.coupon_min_order(Number(placeError.details) > 0 ? formatTaka(Number(placeError.details)) : "")
      : (t.placeErrors[placeError.code] ?? strings.cart.quoteErrors[placeError.code] ?? t.placeErrors.fallback)
    : null;

  const confirmLabel = quote ? t.confirmWithTotal(formatTaka(quote.total)) : t.confirm;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
      <div className="lg:col-start-2 lg:row-start-1 lg:self-start">
        <OrderSummary lines={lines} totals={totals} coupon={coupon} />
      </div>

      <div className="max-w-2xl lg:col-start-1 lg:row-start-1">
        <CheckoutForm
          id={FORM_ID}
          zones={zones}
          initialZoneId={state?.zoneId != null ? String(state.zoneId) : ""}
          onZoneChange={setZoneId}
          confirmLabel={confirmLabel}
          confirmDisabled={quoteBlocked}
          submitting={placeOrder.isPending}
          onSubmit={submit}
        >
          {placeMessage && (
            <p className="text-small text-fg" role="alert">
              {placeMessage}
            </p>
          )}
        </CheckoutForm>
      </div>

      {/* Mobile sticky confirm (roadmap §6.7): sits above the 64px tab bar and submits the form. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 border-t border-line bg-obsidian/95 p-3 backdrop-blur lg:hidden">
        <Button type="submit" form={FORM_ID} size="lg" loading={placeOrder.isPending} disabled={quoteBlocked} className="w-full">
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

function Checkout() {
  const lines = useCart((s) => s.lines);
  const { state } = useLocation();
  const { data: zones, isPending, error, refetch } = useDeliveryZones();

  let body;
  if (lines.length === 0) {
    body = <EmptyState />;
  } else if (isPending) {
    body = (
      <div className="max-w-2xl space-y-6" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  } else if (error || !zones?.length) {
    body = (
      <div className="max-w-2xl space-y-4" role="alert">
        <p className="text-body text-fg">{t.zonesError}</p>
        <Button variant="secondary" onClick={() => refetch()}>
          {strings.data.retry}
        </Button>
      </div>
    );
  } else {
    body = <CheckoutBody zones={zones} lines={lines} state={state} />;
  }

  return (
    <Container className="py-section-sm lg:py-section">
      <title>{`${t.title} | WRISTORY`}</title>
      <SectionHeading as="h1" eyebrow={t.eyebrow} title={t.title} subtitle={t.intro} align="left" className="mb-10" />
      {lines.length > 0 && (
        <Button as={Link} to="/cart" variant="link" className="mb-8">
          {t.backToBag}
        </Button>
      )}
      {body}
    </Container>
  );
}

export default Checkout;
