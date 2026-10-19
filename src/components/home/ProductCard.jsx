import { memo, useState } from "react";
import { Badge, Button } from "../common";
import { HeartIcon, StarIcon, BagIcon } from "../layout/icons";

function ProductCard({ product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const { name, price, originalPrice, discount, rating, reviews, badge, icon: Icon } = product;

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-bg-secondary">
        {/* base placeholder image */}
        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
          <Icon className="h-16 w-16 text-ink/10 sm:h-20 sm:w-20" />
        </div>

        {/* secondary placeholder image, crossfades in on hover */}
        <div className="absolute inset-0 flex scale-105 items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
          <Icon className="h-16 w-16 text-ink/15 sm:h-20 sm:w-20" />
        </div>

        {badge && (
          <Badge variant={badge.variant} className="absolute left-3 top-3 z-10">
            {badge.label}
          </Badge>
        )}

        <button
          type="button"
          onClick={() => setWishlisted((w) => !w)}
          aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          aria-pressed={wishlisted}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white/90 backdrop-blur transition-colors duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            wishlisted ? "text-sale" : "text-ink"
          }`}
        >
          <HeartIcon className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
        </button>

        <div className="absolute inset-x-3 bottom-3 z-10 translate-y-2 opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <Button variant="primary" size="sm" className="w-full gap-2">
            <BagIcon className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-4">
        <div className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5 stars, ${reviews} reviews`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "text-ink" : "text-ink/15"}`} />
          ))}
          <span className="text-small text-ink-secondary" aria-hidden="true">({reviews})</span>
        </div>

        <h3 className="line-clamp-1 text-body font-semibold text-ink">{name}</h3>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-body font-semibold text-ink">${price.toFixed(2)}</span>
          {originalPrice && (
            <span className="text-small text-ink-secondary line-through">${originalPrice.toFixed(2)}</span>
          )}
          {discount && <span className="text-small font-semibold text-sale">-{discount}%</span>}
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);
