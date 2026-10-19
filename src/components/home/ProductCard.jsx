import { memo, useEffect, useState } from "react";
import { Link } from "react-router";
import { Badge, Button, Price } from "../common";
import { HeartIcon, BagIcon } from "../layout/icons";
import { discountPercent } from "../../lib/format";
import { strings } from "../../lib/strings";
import { useCart } from "../../store/cart";
import { selectInWishlist, useWishlist } from "../../store/wishlist";

// Template card wired to Supabase products and the cart/wishlist stores (A5).
// B5 replaces it with the HORVEX ProductCard.

const CART_FEEDBACK = {
  out_of_stock: strings.badge.soldOut,
  max_qty: strings.product.maxQty,
  max_lines: strings.product.bagFull,
};

function cardBadge(product) {
  if (product.stock < 1) return { variant: "soldOut", label: strings.badge.soldOut };
  const percent = discountPercent(product.price, product.compare_at_price);
  if (percent) return { variant: "sale", label: `−${percent}%` };
  if (product.badges.includes("limited")) return { variant: "limited", label: strings.badge.limited };
  if (product.badges.includes("new")) return { variant: "new", label: strings.badge.new };
  return null;
}

function ProductCard({ product }) {
  const { id, slug, name, price, compare_at_price: compareAt, images, variants, stock } = product;
  const wishlisted = useWishlist(selectInWishlist(id));
  const toggleWishlist = useWishlist((s) => s.toggle);
  const addToCart = useCart((s) => s.add);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const [primary, secondary] = images;
  const badge = cardBadge(product);
  const href = `/product/${slug}`;
  const soldOut = stock < 1;

  const handleAdd = () => {
    const result = addToCart(product);
    setFeedback(result.ok ? strings.product.added : CART_FEEDBACK[result.reason]);
  };

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-bg-secondary">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          {primary && (
            <img
              src={primary.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
            />
          )}
          {secondary && (
            <img
              src={secondary.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
            />
          )}
        </Link>

        {badge && (
          <Badge variant={badge.variant} className="absolute left-3 top-3 z-10">
            {badge.label}
          </Badge>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={wishlisted ? strings.product.wishlistRemove(name) : strings.product.wishlistAdd(name)}
          aria-pressed={wishlisted}
          className={`absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/90 backdrop-blur transition-colors duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            wishlisted ? "text-sale" : "text-ink"
          }`}
        >
          <HeartIcon className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
        </button>

        {!soldOut && (
          <div className="absolute inset-x-3 bottom-3 z-10 translate-y-2 opacity-0 transition-all duration-200 ease-out group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
            {variants.length > 0 ? (
              <Button as={Link} to={href} variant="primary" size="sm" className="w-full">
                {strings.product.chooseOptions}
              </Button>
            ) : (
              <Button variant="primary" size="sm" className="w-full gap-2" onClick={handleAdd}>
                <BagIcon className="h-4 w-4" />
                {feedback ?? strings.product.addToCart}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 pt-4">
        <h3 className="line-clamp-1 text-body font-semibold text-ink">
          <Link to={href} className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            {name}
          </Link>
        </h3>
        <Price amount={price} compareAt={compareAt} size="sm" />
        <p className="sr-only" role="status">
          {feedback}
        </p>
      </div>
    </div>
  );
}

export default memo(ProductCard);
