import { Container, SectionHeading, Reveal } from "../common";
import TestimonialCard from "./TestimonialCard";
import testimonials from "../../data/testimonials";

function CustomerReviews() {
  return (
    <section className="bg-bg-secondary py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow="Testimonials" title="Loved by Our Customers" align="center" />

        {/* Mobile / tablet: horizontal snap-scroll. Desktop (lg+): static 3-col grid. */}
        <div
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0"
          role="list"
        >
          {testimonials.slice(0, 3).map((testimonial, i) => (
            <Reveal
              key={testimonial.id}
              role="listitem"
              delay={i * 100}
              className="w-[85%] flex-none snap-start sm:w-[60%] lg:w-auto"
            >
              <TestimonialCard testimonial={testimonial} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default CustomerReviews;
