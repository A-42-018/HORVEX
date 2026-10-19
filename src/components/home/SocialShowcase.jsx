import { Container, SectionHeading, Reveal } from "../common";
import { InstagramIcon } from "../layout/icons";
import social from "../../data/social";

function SocialShowcase() {
  return (
    <section className="bg-bg py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="@brandname"
          title="Follow the Community"
          subtitle="Tag us in your favorites for a chance to be featured."
          align="center"
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
          {social.map(({ id, icon: Icon }, i) => (
            <Reveal
              key={id}
              as="a"
              href="#"
              aria-label="View post on Instagram"
              delay={Math.min(i, 5) * 60}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <Icon className="h-10 w-10 text-ink/10 transition-transform duration-300 ease-out group-hover:scale-110 sm:h-12 sm:w-12" />
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-300 group-hover:bg-ink/40">
                <InstagramIcon className="h-6 w-6 scale-90 text-white opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default SocialShowcase;
