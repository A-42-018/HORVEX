import { Container, Reveal } from "../common";
import { TruckIcon, LockIcon, RefreshIcon, ShieldCheckIcon } from "../layout/icons";

const FEATURES = [
  {
    icon: TruckIcon,
    title: "Fast Delivery",
    description: "Get your order delivered quickly, right to your door.",
  },
  {
    icon: LockIcon,
    title: "Secure Payment",
    description: "Checkout safely with fully encrypted payment methods.",
  },
  {
    icon: RefreshIcon,
    title: "Easy Returns",
    description: "Not the right fit? Return it within 30 days, hassle-free.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Quality Assured",
    description: "Every product is checked to meet our quality standards.",
  },
];

function TrustFeatures() {
  return (
    <section className="border-y border-border bg-bg-secondary py-10 lg:py-12">
      <Container>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <Reveal
              key={title}
              delay={i * 80}
              className="flex items-start gap-4 lg:px-6 lg:first:pl-0 lg:last:pr-0"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-ink">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-body font-semibold text-ink">{title}</p>
                <p className="text-small text-ink-secondary">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default TrustFeatures;
