import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button, Drawer, IconButton, Price } from "../common";
import { useProducts } from "../../hooks/useCatalog";
import { useSiteSettings } from "../../hooks/useContent";
import { addToBag } from "../../lib/cartActions";
import { MAX_LINES, selectCartCount, selectCartEstimate, useCart } from "../../store/cart";
import { useUI } from "../../store/ui";
import { formatTaka } from "../../lib/format";
import { strings } from "../../lib/strings";

const t = strings.cart;

function QtyStepper({ line }) {
  const setQty = useCart((s) => s.setQty);
  const atMax = line.qty >= line.maxQty;
  return (
    <div className="inline-flex items-center rounded-control border border-line" role="group" aria-label={t.qtyGroup(line.name)}>
      <IconButton
        label={t.decrease(line.name)}
        variant="ghost"
        disabled={line.qty <= 1}
        onClick={() => setQty(line.key, line.qty - 1)}
      >
        <Minus size={16} strokeWidth={1.5} aria-hidden="true" />
      </IconButton>
      <span className="min-w-8 text-center text-small tabular-nums" aria-live="polite">
        {line.qty}
      </span>
      <IconButton
        label={atMax ? t.maxQty : t.increase(line.name)}
        variant="ghost"
        disabled={atMax}
        onClick={() => setQty(line.key, line.qty + 1)}
      >
        <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
      </IconButton>
    </div>
  );
}

function Line({ line }) {
  const remove = useCart((s) => s.remove);
  return (
    <li className="flex gap-4 py-5">
      <Link to={`/product/${line.slug}`} className="block h-24 w-20 shrink-0 overflow-hidden rounded-card bg-raised">
        {line.image && <img src={line.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/product/${line.slug}`} className="block truncate text-body text-fg hover:text-brand focus-visible:text-brand">
              {line.name}
            </Link>
            {line.variantName && <p className="text-small text-muted">{line.variantName}</p>}
          </div>
          <IconButton label={t.remove(line.name)} variant="ghost" className="-mr-2 -mt-2" onClick={() => remove(line.key)}>
            <Trash2 size={18} strokeWidth={1.5} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <QtyStepper line={line} />
          <p className="text-body font-semibold tabular-nums text-brand">{formatTaka(line.price * line.qty)}</p>
        </div>
      </div>
    </li>
  );
}

// Progress towards free delivery. Hidden when the store has no threshold set.
// Uses the snapshot estimate; the real delivery charge is decided at checkout.
function FreeDeliveryBar({ estimate }) {
  const { data: settings } = useSiteSettings();
  const threshold = settings?.free_delivery_threshold;
  if (!threshold) return null;

  const remaining = Math.max(0, threshold - estimate);
  const percent = Math.min(100, Math.round((estimate / threshold) * 100));
  return (
    <div className="mb-2 rounded-card border border-line bg-surface p-4">
      <p className="text-small text-fg" role="status">
        {remaining > 0 ? t.freeDeliveryMore(formatTaka(remaining)) : t.freeDeliveryReached}
      </p>
      <div
        role="progressbar"
        aria-label={t.freeDeliveryLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-3 h-1 overflow-hidden rounded-pill bg-line"
      >
        <div
          className="h-full origin-left rounded-pill bg-gold transition-transform duration-slow"
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>
    </div>
  );
}

// One accessory suggestion from the (admin-managed) accessories category.
// Renders nothing until that category has an in-stock, option-free product.
// Only mounted while the drawer is open so closed pages don't fetch it.
function Upsell({ lines }) {
  const { data } = useProducts({ category: "accessories", limit: 6 });
  if (lines.length >= MAX_LINES) return null;
  const pick = data?.items.find(
    (p) => p.stock > 0 && p.variants.length === 0 && !lines.some((l) => l.productId === p.id),
  );
  if (!pick) return null;

  return (
    <section aria-label={t.upsellTitle} className="mt-4 border-t border-line pt-5">
      <h3 className="text-eyebrow text-muted">{t.upsellTitle}</h3>
      <div className="mt-3 flex items-center gap-4">
        <Link to={`/product/${pick.slug}`} className="block h-20 w-16 shrink-0 overflow-hidden rounded-card bg-raised">
          {pick.images[0] && (
            <img src={pick.images[0].url} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/product/${pick.slug}`} className="block truncate text-body text-fg hover:text-brand focus-visible:text-brand">
            {pick.name}
          </Link>
          <Price amount={pick.price} compareAt={pick.compare_at_price} size="sm" />
        </div>
        <Button variant="secondary" size="sm" aria-label={t.upsellAdd(pick.name)} onClick={() => addToBag(pick)}>
          {strings.product.addToCart}
        </Button>
      </div>
    </section>
  );
}

function EmptyState({ onClose }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <ShoppingBag size={40} strokeWidth={1} aria-hidden="true" className="text-gold" />
      <p className="mt-4 text-h3">{t.emptyTitle}</p>
      <p className="mt-2 text-small text-muted">{t.emptyBody}</p>
      <Button as={Link} to="/shop" onClick={onClose} className="mt-6">
        {t.continueShopping}
      </Button>
    </div>
  );
}

// Cart drawer (roadmap §6.6). Lines are display snapshots from the cart store;
// the subtotal is an estimate and checkout re-quotes on the server.
function CartDrawer() {
  const open = useUI((s) => s.cartOpen);
  const closeAll = useUI((s) => s.closeAll);
  const lines = useCart((s) => s.lines);
  const count = useCart(selectCartCount);
  const estimate = useCart(selectCartEstimate);
  const { pathname } = useLocation();

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  const footer =
    lines.length > 0 ? (
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-small text-muted">{t.subtotal}</span>
          <span className="text-price tabular-nums text-brand">{formatTaka(estimate)}</span>
        </div>
        <p className="text-small text-muted">{t.shippingNote}</p>
        <div className="grid gap-3">
          <Button as={Link} to="/checkout" size="lg">
            {t.checkout}
          </Button>
          <Button as={Link} to="/cart" variant="secondary" size="lg">
            {t.viewBag}
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <Drawer open={open} onClose={closeAll} title={count > 0 ? t.titleCount(count) : t.title} footer={footer}>
      {lines.length === 0 ? (
        <EmptyState onClose={closeAll} />
      ) : (
        <>
          <FreeDeliveryBar estimate={estimate} />
          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <Line key={line.key} line={line} />
            ))}
          </ul>
          {open && <Upsell lines={lines} />}
        </>
      )}
    </Drawer>
  );
}

export default CartDrawer;
