import { Button, Container, Reveal } from "../common";
import { ChevronRightIcon, SparkleIcon } from "../layout/icons";

function PromoBanner() {
  return (
    <section className="relative overflow-hidden bg-ink py-20 lg:py-28">
      {/* Visual background — dark gradient + soft radial glows standing in for a
          high-quality lifestyle/product photo (keeps the app self-contained, no
          image assets). */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink to-[#2a2a28]" />
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sale/20 blur-3xl" />
        {/* Elegant overlay for text contrast */}
        <div className="absolute inset-0 bg-ink/30" />
      </div>

      <Container className="relative">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-small font-semibold text-white/80">
            <SparkleIcon className="h-4 w-4" />
            Limited-Time Offer
          </span>

          <h2 className="text-display text-white">Up to 40% Off</h2>

          <p className="text-body text-white/70">
            Your favorites, now at better prices. Don&apos;t miss out before it&apos;s gone.
          </p>

          <Button
            as="a"
            href="#"
            variant="secondary"
            size="lg"
            className="group mt-2 bg-white text-ink hover:bg-white/90 focus-visible:!outline-white"
          >
            Shop Sale
            <ChevronRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}

export default PromoBanner;
