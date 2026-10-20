import { useEffect, useState } from "react";
import { Button, Price } from "../common";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useOrderNow } from "../../hooks/useOrderNow";
import { strings } from "../../lib/strings";
import { useUI } from "../../store/ui";

// True once `ref`'s element has scrolled up past the top of the viewport.
// (Below the fold on first load doesn't count: the buyer hasn't reached it yet.)
function useScrolledPast(ref, enabled) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      setPast(false);
    };
  }, [ref, enabled]);
  return enabled && past;
}

// Mobile-only (< lg) buy bar: price + Order Now, pinned above the 64px tab bar
// once the main Order Now button leaves the viewport (roadmap §6.4, §8).
// Reuses BuyActions' order-now logic via useOrderNow.
function StickyBuyBar({ product, selected, qty, inStock, orderRef }) {
  const mobile = useMediaQuery("(max-width: 1023.98px)");
  const visible = useScrolledPast(orderRef, mobile);
  const setStickyBar = useUI((s) => s.setStickyBar);
  const orderNow = useOrderNow(product, { selected, qty });

  useEffect(() => {
    setStickyBar(visible);
    return () => setStickyBar(false);
  }, [visible, setStickyBar]);

  const price = selected?.price_override ?? product.price;
  const compareAt = product.variants?.length ? undefined : product.compare_at_price;

  return (
    <div
      role="region"
      aria-label={strings.product.sticky.label}
      inert={!visible}
      className={`fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 border-t border-line bg-obsidian/95 px-4 py-3 backdrop-blur transition-[transform,opacity] duration-base ease-out-expo lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-small font-medium text-fg">
            {product.name}
            {selected?.name ? <span className="text-muted"> · {selected.name}</span> : null}
          </p>
          <Price amount={price} compareAt={compareAt} size="sm" showDiscount={false} />
        </div>
        <Button size="lg" className="shrink-0" disabled={!inStock} onClick={orderNow}>
          {inStock ? strings.product.orderNowShort : strings.product.soldOut}
        </Button>
      </div>
    </div>
  );
}

export default StickyBuyBar;
