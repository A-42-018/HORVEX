import { Container, SectionHeading, Reveal } from "../common";
import { ChevronRightIcon } from "../layout/icons";
import categories from "../../data/categories";

function CategoryShowcase() {
  return (
    <section className="bg-bg py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Shop by Category"
          title="Find What You're Looking For"
          subtitle="Browse our curated collections, organized to help you shop faster."
        />

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {categories.map(({ id, name, cta, icon: Icon }, i) => (
            <Reveal
              key={id}
              as="a"
              href="#"
              delay={Math.min(i, 5) * 80}
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-lg border border-border bg-bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="h-16 w-16 text-ink/10 transition-transform duration-300 ease-out group-hover:scale-110 sm:h-20 sm:w-20" />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />

              <div className="relative z-10 flex flex-col gap-1 p-4 sm:p-5">
                <h3 className="text-body font-semibold text-white sm:text-h3">{name}</h3>
                <span className="flex items-center gap-1 text-small font-medium text-white/80 transition-colors duration-200 group-hover:text-white">
                  {cta}
                  <ChevronRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default CategoryShowcase;
