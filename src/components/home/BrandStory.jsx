import { Container, Button, Reveal } from "../common";
import { ChevronRightIcon, ShieldCheckIcon, LeafIcon, HammerIcon, CompassIcon, HeartIcon } from "../layout/icons";

const PILLARS = [
  {
    icon: ShieldCheckIcon,
    title: "Quality",
    description: "Every piece is tested to outlast trends, not just seasons.",
  },
  {
    icon: LeafIcon,
    title: "Materials",
    description: "Responsibly sourced fabrics chosen for feel and longevity.",
  },
  {
    icon: HammerIcon,
    title: "Craftsmanship",
    description: "Small-batch production with an eye for the smallest details.",
  },
  {
    icon: CompassIcon,
    title: "Design Philosophy",
    description: "Timeless silhouettes over fast-fashion noise.",
  },
  {
    icon: HeartIcon,
    title: "Customer-First",
    description: "Every decision starts with how it serves the person wearing it.",
  },
];

function BrandStory() {
  return (
    <section className="bg-bg py-section-sm lg:py-section">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: lifestyle image */}
          <Reveal
            variant="slide-right"
            className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-secondary lg:order-1"
          >
            <CompassIcon className="h-20 w-20 text-ink/10" />
          </Reveal>

          {/* Right: story */}
          <Reveal as="div" variant="slide-left" delay={100} className="flex flex-col items-start gap-6 lg:order-2">
            <span className="text-small font-semibold uppercase tracking-wider text-ink-secondary">
              Our Story
            </span>

            <h2 className="text-display text-ink">Made With Purpose</h2>

            <p className="text-body text-ink-secondary">
              We started with a simple idea: clothing should be made to last, not to be
              replaced. Every collection begins with honest materials and ends with pieces
              that earn a permanent place in your wardrobe — designed thoughtfully, made
              carefully, and built around the people who wear them.
            </p>

            <div className="flex w-full flex-col gap-5 border-t border-border pt-6">
              {PILLARS.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg-secondary text-ink-secondary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-body font-semibold text-ink">{title}</h3>
                    <p className="text-small text-ink-secondary">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="lg" className="group mt-2" as="a" href="#">
              Learn More
              <ChevronRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

export default BrandStory;
