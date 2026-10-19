import { Container, SectionHeading, Reveal } from "../common";

const FEATURES = [
  {
    number: "01",
    title: "Premium Quality",
    description:
      "Every product is selected and tested for durability, comfort and craftsmanship — nothing ships unless it earns a place in your wardrobe.",
  },
  {
    number: "02",
    title: "Thoughtful Design",
    description:
      "Timeless silhouettes over passing trends. Each piece is designed to feel considered, versatile and effortless to wear.",
  },
  {
    number: "03",
    title: "Reliable Service",
    description:
      "From checkout to delivery to returns, we keep things simple and dependable — so you can shop with confidence every time.",
  },
];

function WhyChooseUs() {
  return (
    <section className="bg-bg py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading title="Why Customers Choose Us" align="center" />

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8 lg:divide-x lg:divide-border">
          {FEATURES.map(({ number, title, description }, i) => (
            <Reveal
              key={number}
              delay={i * 100}
              className="flex flex-col gap-4 lg:px-8 lg:first:pl-0 lg:last:pr-0"
            >
              <span className="text-display font-semibold text-ink/10">{number}</span>
              <h3 className="text-h2 text-ink">{title}</h3>
              <p className="text-body text-ink-secondary">{description}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default WhyChooseUs;
