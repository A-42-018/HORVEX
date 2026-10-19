import { Button, Container, Reveal } from "../common";
import { ChevronRightIcon } from "../layout/icons";

function FinalCTA() {
  return (
    <section className="bg-bg-secondary py-20 lg:py-28">
      <Container>
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <h2 className="text-display text-ink">Find Something You&apos;ll Love</h2>

          <p className="text-body text-ink-secondary">
            Explore our latest collection and discover your next favorite.
          </p>

          <Button as="a" href="#" variant="primary" size="lg" className="group mt-2">
            Shop Collection
            <ChevronRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}

export default FinalCTA;
