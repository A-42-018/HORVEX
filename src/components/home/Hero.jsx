import { Container, Button, Card, Badge } from "../common";
import { ChevronRightIcon, TruckIcon, ShieldCheckIcon, StarIcon, BagIcon } from "../layout/icons";

function Hero() {
  return (
    <section className="relative overflow-hidden bg-bg py-section-sm lg:py-section">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className="flex flex-col items-start gap-6">
            <span className="animate-fade-up text-small font-semibold uppercase tracking-wider text-ink-secondary">
              New Season Arrivals
            </span>

            <h1 className="animate-fade-up delay-100 text-display text-ink">
              Style That Fits Your Everyday
            </h1>

            <p className="animate-fade-up delay-200 max-w-md text-body text-ink-secondary">
              Discover thoughtfully designed products made for modern living.
            </p>

            <div className="animate-fade-up delay-300 flex flex-wrap items-center gap-4">
              <Button variant="primary" size="lg">
                Shop Now
              </Button>
              <Button variant="outline" size="lg" className="group">
                Explore Collection
                <ChevronRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </div>

            <div className="animate-fade-up delay-300 mt-2 flex w-full flex-wrap items-center gap-x-8 gap-y-4 border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <div className="flex text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4" />
                  ))}
                </div>
                <span className="text-small font-medium text-ink">4.9/5 Customer Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-ink-secondary" />
                <span className="text-small font-medium text-ink">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-ink-secondary" />
                <span className="text-small font-medium text-ink">Quality Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="animate-fade-up delay-200 relative">
            <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-secondary">
              <BagIcon className="h-24 w-24 text-ink/10" />
            </div>

            <Card className="absolute -left-3 top-8 hidden items-center gap-3 p-4 sm:flex lg:-left-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <StarIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-body font-semibold leading-tight text-ink">4.9/5</p>
                <p className="text-small text-ink-secondary">2,400+ reviews</p>
              </div>
            </Card>

            <Card className="absolute -right-3 bottom-8 hidden max-w-[220px] p-4 sm:block lg:-right-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-small font-semibold text-ink">Minimal Zip Jacket</span>
                <Badge variant="new">Best Seller</Badge>
              </div>
              <p className="mt-1 text-body font-semibold text-ink">$89.00</p>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Hero;
