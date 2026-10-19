import { memo } from "react";
import { Card } from "../common";
import { StarIcon } from "../layout/icons";

function TestimonialCard({ testimonial, className = "" }) {
  const { name, avatarInitials, rating, review, product } = testimonial;

  return (
    <Card className={`flex h-full flex-col gap-5 p-6 lg:p-7 ${className}`}>
      <div className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className={`h-4 w-4 ${i < rating ? "text-ink" : "text-ink/15"}`}
          />
        ))}
      </div>

      <p className="text-body flex-1 text-ink-secondary">&ldquo;{review}&rdquo;</p>

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-bg-secondary text-small font-semibold text-ink"
          aria-hidden="true"
        >
          {avatarInitials}
        </span>
        <div className="flex flex-col">
          <span className="text-body font-semibold text-ink">{name}</span>
          {product && (
            <span className="text-small text-ink-secondary">Purchased {product}</span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default memo(TestimonialCard);
