import { useId, useState } from "react";
import { Link } from "react-router";
import { ChevronDown } from "lucide-react";
import { Button, Container, Reveal, SectionHeading, Skeleton } from "../common";
import { useFaqs, useHomeSections } from "../../hooks/useContent";
import { strings } from "../../lib/strings";

// Home FAQ (roadmap §6.1 #15): dark accordion, one answer open at a time, from
// the visible `faqs` rows. Heading from `home_sections.faq` (title/subtitle);
// `config.limit` caps how many show (default 6, max 12).

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

function FAQItem({ item, isOpen, onToggle, uid }) {
  const panelId = `${uid}-panel`;
  const buttonId = `${uid}-button`;

  return (
    <div className="border-b border-line">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <span className="text-body font-semibold text-fg">{item.question}</span>
          <ChevronDown
            aria-hidden="true"
            size={20}
            strokeWidth={1.5}
            className={`shrink-0 text-brand transition-transform duration-base ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-[grid-template-rows] duration-base ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="pb-5 pr-8 text-body text-muted">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

function FAQ() {
  const uid = useId();
  const [openId, setOpenId] = useState(null);
  const { data: sections } = useHomeSections();
  const { data: faqs, isPending } = useFaqs();
  const section = sections?.find((s) => s.key === "faq");
  const configured = Number(section?.config?.limit);
  const limit = Number.isFinite(configured) && configured > 0 ? Math.min(Math.floor(configured), MAX_LIMIT) : DEFAULT_LIMIT;
  const items = (faqs ?? []).slice(0, limit);

  // Nothing to show and nothing loading: drop the section rather than an empty box.
  if (!isPending && items.length === 0) return null;

  return (
    <section aria-labelledby={`${uid}-title`} className="section-dark py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10 lg:gap-12">
        <SectionHeading
          eyebrow={strings.faq.eyebrow}
          title={section?.title || strings.faq.title}
          subtitle={section?.subtitle}
          id={`${uid}-title`}
        />
        <Reveal className="mx-auto w-full max-w-3xl border-t border-line">
          {isPending
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="my-3 h-8 w-full" />)
            : items.map((item) => (
                <FAQItem
                  key={item.id}
                  item={item}
                  uid={`${uid}-${item.id}`}
                  isOpen={openId === item.id}
                  onToggle={() => setOpenId((cur) => (cur === item.id ? null : item.id))}
                />
              ))}
        </Reveal>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-body text-muted">{strings.faq.more}</p>
          <Button as={Link} to="/contact" variant="link" size="sm">
            {strings.faq.contact}
          </Button>
        </div>
      </Container>
    </section>
  );
}

export default FAQ;
