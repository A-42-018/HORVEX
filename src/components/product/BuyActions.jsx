import { Button } from "../common";
import { HeartBurst } from "../motion";
import { useSiteSettings } from "../../hooks/useContent";
import { useOrderNow } from "../../hooks/useOrderNow";
import { addToBag } from "../../lib/cartActions";
import { normalizePhone } from "../../lib/format";
import { strings } from "../../lib/strings";
import { selectInWishlist, useWishlist } from "../../store/wishlist";
import { WhatsAppGlyph } from "../layout/WhatsAppFab";

const ACTION = "w-full";

// Primary Order Now (COD, straight to checkout), outline Add to Bag + heart,
// and a WhatsApp text link whose number comes from site settings (hidden when
// empty). `selected` / `qty` come from ProductDetail; `orderRef` marks the primary
// button so StickyBuyBar knows when it has scrolled out of view.
function BuyActions({ product, selected, qty, inStock, orderRef }) {
  const { data: settings } = useSiteSettings();
  const wishlisted = useWishlist(selectInWishlist(product.id));
  const toggleWishlist = useWishlist((s) => s.toggle);

  const options = { variant: selected, qty };
  const whatsapp = normalizePhone(settings?.whatsapp_number);
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.slice(1)}?text=${encodeURIComponent(
        strings.product.whatsappMessage(product.name, selected?.name, qty, window.location.href),
      )}`
    : null;

  const orderNow = useOrderNow(product, { selected, qty });

  return (
    <div className="flex flex-col gap-3">
      <Button ref={orderRef} size="lg" className={ACTION} disabled={!inStock} onClick={orderNow}>
        {inStock ? strings.product.orderNow : strings.product.soldOut}
      </Button>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" disabled={!inStock} onClick={(e) => addToBag(product, options, { from: e.currentTarget })}>
          {strings.product.addToCart}
        </Button>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={wishlisted ? strings.product.wishlistRemove(product.name) : strings.product.wishlistAdd(product.name)}
          aria-pressed={wishlisted}
          className="flex h-13 w-13 shrink-0 items-center justify-center rounded-control border border-line text-fg transition-colors duration-fast hover:border-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:h-12 sm:w-12"
        >
          <HeartBurst active={wishlisted} className={wishlisted ? "text-oxblood-light" : ""} />
        </button>
      </div>

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 text-nav font-semibold text-fg underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <WhatsAppGlyph className="h-5 w-5" />
          {strings.product.whatsappOrder}
        </a>
      )}
    </div>
  );
}

export default BuyActions;
