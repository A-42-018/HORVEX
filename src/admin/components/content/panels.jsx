import { Star } from "lucide-react";
import { Badge } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { faqHooks, testimonialHooks } from "../../hooks/useContentAdmin";
import ContentPanel from "../homepage/ContentPanel";
import FaqModal from "./FaqModal";
import TestimonialModal from "./TestimonialModal";

const faq = strings.admin.content.faq;
const testimonials = strings.admin.content.testimonials;

const shorten = (value, max = 60) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

function FaqInfo(row) {
  return (
    <>
      <p className="line-clamp-2 text-body font-semibold text-fg">{row.question}</p>
      <p className="line-clamp-1 text-small text-muted">{row.answer}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral">{row.topic?.trim() || faq.noTopic}</Badge>
        {!row.is_visible && <Badge variant="neutral">{faq.hidden}</Badge>}
      </div>
    </>
  );
}

const faqConfig = {
  copy: faq,
  hooks: faqHooks,
  activeField: "is_visible",
  nameOf: (row) => shorten(row.question),
  info: FaqInfo,
  summary: (rows) => faq.count(rows.length, rows.filter((row) => row.is_visible).length),
  Modal: FaqModal,
  modalProp: "faq",
};

function TestimonialInfo(row) {
  return (
    <>
      <p className="truncate text-body font-semibold text-fg">{[row.name, row.location].filter(Boolean).join(" · ")}</p>
      <p className="line-clamp-2 text-small text-muted">{row.text}</p>
      <div className="flex flex-wrap gap-2">
        {row.rating != null && (
          <Badge variant="neutral" className="gap-1">
            <Star aria-hidden="true" size={12} strokeWidth={1.5} />
            {testimonials.ratingBadge(row.rating)}
          </Badge>
        )}
        {!row.is_visible && <Badge variant="neutral">{testimonials.hidden}</Badge>}
      </div>
    </>
  );
}

const testimonialConfig = {
  copy: testimonials,
  hooks: testimonialHooks,
  activeField: "is_visible",
  nameOf: (row) => row.name,
  info: TestimonialInfo,
  summary: (rows) => testimonials.count(rows.length, rows.filter((row) => row.is_visible).length),
  Modal: TestimonialModal,
  modalProp: "testimonial",
};

export const FaqPanel = () => <ContentPanel config={faqConfig} />;
export const TestimonialsPanel = () => <ContentPanel config={testimonialConfig} />;
