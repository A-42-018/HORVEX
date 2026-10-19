import { useId } from "react";
import { Container, Reveal, SectionHeading } from "../common";
import { useHomeSections } from "../../hooks/useContent";
import { strings } from "../../lib/strings";

// How to Order (roadmap §6.1 #11): three COD steps joined by a gold line that
// draws in when the section scrolls into view (transform only). Heading and
// steps from `home_sections.how_to_order` (title/subtitle, config.steps[{title,text}]),
// falling back to strings.howToOrder. Exactly three steps are shown.

const STEP_COUNT = 3;

function cleanSteps(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s.title === "string" && s.title.trim())
    .slice(0, STEP_COUNT)
    .map((s) => ({ title: s.title.trim(), text: typeof s.text === "string" ? s.text.trim() : "" }));
}

function HowToOrder() {
  const uid = useId();
  const { data: sections } = useHomeSections();
  const section = sections?.find((s) => s.key === "how_to_order");
  const configured = cleanSteps(section?.config?.steps);
  const steps = configured.length === STEP_COUNT ? configured : strings.howToOrder.steps;

  return (
    <section aria-labelledby={`${uid}-title`} className="section-dark overflow-x-clip py-section-sm lg:py-section">
      <Container className="flex flex-col gap-12 lg:gap-16">
        <SectionHeading
          eyebrow={section?.title || strings.howToOrder.eyebrow}
          title={section?.subtitle || strings.howToOrder.title}
          id={`${uid}-title`}
        />

        <Reveal as="ol" className="group/steps relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {/* Connecting line: md+ runs through the number badges; mobile runs down the left. */}
          <span
            aria-hidden="true"
            className="absolute bottom-6 left-6 top-6 w-px origin-top scale-y-0 bg-brand transition-transform duration-[1200ms] ease-out group-[.translate-y-0]/steps:scale-y-100 md:hidden"
          />
          <span
            aria-hidden="true"
            className="absolute left-[16.667%] right-[16.667%] top-6 hidden h-px origin-left scale-x-0 bg-brand transition-transform duration-[1200ms] ease-out group-[.translate-y-0]/steps:scale-x-100 md:block"
          />
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex gap-6 md:flex-col md:items-center md:gap-5 md:text-center">
              <span
                aria-hidden="true"
                className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand bg-obsidian text-h3 tabular-nums text-brand"
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-h3 text-fg">
                  <span className="sr-only">{strings.howToOrder.stepLabel(i + 1)} </span>
                  {step.title}
                </h3>
                {step.text && <p className="max-w-xs text-body text-muted">{step.text}</p>}
              </div>
            </li>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

export default HowToOrder;
