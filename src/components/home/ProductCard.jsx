import { memo } from "react";
import { Link } from "react-router";
import { Heart, Plus } from "lucide-react";
import { Badge, Button, Price } from "../common";
import { discountPercent } from "../../lib/format";
import { responsiveImage } from "../../lib/images";
import { strings } from "../../lib/strings";
import { addToBag } from "../../lib/cartActions";
import { selectInWishlist, useWishlist } from "../../store/wishlist";

// WRISTORY product card (roadmap §6.2), wired to the cart and wishlist stores.
// Quick View and "Notify me" are not built yet (no modal / no back-in-stock
// table), so sold-out cards simply drop the add controls.

const SIZES = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";
const MAX_SWATCHES = 4;
// `hover:hover` keeps the crossfade from sticking after a tap on touch screens.
const CAN_HOVER = "[@media(hover:hover)]";

// One badge at most: sold out > sale (≥ 10%) > limited > new.
function cardBadge(product) {
  if (product.stock < 1) return { variant: "soldOut", label: strings.badge.soldOut };
  const percent = discountPercent(product.price, product.compare_at_price);
  if (percent) return { variant: "sale", label: `−${percent}%` };
  if (product.badges?.includes("limited")) return { variant: "limited", label: strings.badge.limited };
  if (product.badges?.includes("new")) return { variant: "new", label: strings.badge.new };
  return null;
}

function CardImage({ image, className }) {
  const { src, srcSet } = responsiveImage(image.url);
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? SIZES : undefined}
      alt=""
      loading="lazy"
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

function Swatches({ variants }) {
  const colours = variants.filter((v) => v.swatch_hex);
  if (!colours.length) return null;
  const extra = colours.length - MAX_SWATCHES;
  return (
    <div className="flex items-center gap-1.5">
      <span className="sr-only">{`${strings.product.colours}: ${colours.map((v) => v.name).join(", ")}`}</span>
      <span aria-hidden="true" className="flex items-center gap-1.5">
        {colours.slice(0, MAX_SWATCHES).map((v) => (
          <span key={v.id} className="h-3 w-3 rounded-full border border-line" style={{ backgroundColor: v.swatch_hex }} />
        ))}
        {extra > 0 && <span className="text-badge text-muted">+{extra}</span>}
      </span>
    </div>
  );
}

function ProductCard({ product }) {
  const { id, slug, name, price, compare_at_price: compareAt, images = [], variants = [], stock, category } = product;
  const wishlisted = useWishlist(selectInWishlist(id));
  const toggleWishlist = useWishlist((s) => s.toggle);

  // Studio shot first; the lifestyle shot (or the next image) is the hover swap.
  const primary = images.find((i) => !i.is_lifestyle) ?? images[0];
  const secondary = images.find((i) => i !== primary && i.is_lifestyle) ?? images.find((i) => i !== primary);

  const badge = cardBadge(product);
  const href = `/product/${slug}`;
  const soldOut = stock < 1;
  const hasOptions = variants.length > 0;
  const fade = soldOut ? "saturate-[.6]" : "";

  return (
    <div className="group flex flex-col">
      <div className="tokens-dark relative aspect-[4/5] overflow-hidden rounded-card bg-carbon">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          {primary && (
            <CardImage
              image={primary}
              className={`transition-opacity duration-slow ${secondary ? `${CAN_HOVER}:group-hover:opacity-0` : ""} ${fade}`}
            />
          )}
          {secondary && (
            <span className={`absolute inset-0 opacity-0 transition-opacity duration-slow ${CAN_HOVER}:group-hover:opacity-100`}>
              <CardImage
                image={secondary}
                className={`scale-[1.04] transition-transform duration-slow ${CAN_HOVER}:group-hover:scale-100 ${fade}`}
              />
            </span>
          )}
        </Link>

        {badge && (
          <Badge variant={badge.variant} className="absolute left-3 top-3 z-10 bg-obsidian/70 backdrop-blur-sm">
            {badge.label}
          </Badge>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={wishlisted ? strings.product.wishlistRemove(name) : strings.product.wishlistAdd(name)}
          aria-pressed={wishlisted}
          className={`absolute right-1 top-1 z-10 flex h-11 w-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus`}
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 transition-[background-color,color,transform] duration-fast hover:bg-ivory active:scale-95 ${
              wishlisted ? "text-oxblood" : "text-ink"
            }`}
          >
            <Heart aria-hidden="true" size={20} strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} />
          </span>
        </button>

        {!soldOut && (
          <>
            {/* Mobile / touch: always-visible round "+" */}
            {hasOptions ? (
              <Link
                to={href}
                aria-label={strings.product.chooseOptionsFor(name)}
                className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-gold text-obsidian transition-transform duration-fast active:scale-95 lg:hidden"
              >
                <Plus aria-hidden="true" size={20} strokeWidth={1.5} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => addToBag(product)}
                aria-label={strings.product.addToCartNamed(name)}
                className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-gold text-obsidian transition-transform duration-fast active:scale-95 lg:hidden"
              >
                <Plus aria-hidden="true" size={20} strokeWidth={1.5} />
              </button>
            )}

            {/* Desktop: bar slides up on hover / keyboard focus */}
            <div className="absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 opacity-0 transition-[transform,opacity] duration-base group-focus-within:translate-y-0 group-focus-within:opacity-100 lg:block [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
              {hasOptions ? (
                <Button as={Link} to={href} size="sm" className="w-full">
                  {strings.product.chooseOptions}
                </Button>
              ) : (
                <Button size="sm" className="w-full" onClick={() => addToBag(product)}>
                  {strings.product.addToCart}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5 pt-4">
        {category?.name && <p className="text-badge text-muted">{category.name}</p>}
        <h3 className="line-clamp-1 text-body font-medium text-fg">
          <Link to={href} className="rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            {name}
          </Link>
        </h3>
        <Price amount={price} compareAt={compareAt} size="sm" />
        <Swatches variants={variants} />
      </div>
    </div>
  );
}

export default memo(ProductCard);
