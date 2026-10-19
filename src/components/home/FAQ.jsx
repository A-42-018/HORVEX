import { useState } from "react";
import { Container, SectionHeading, Reveal } from "../common";
import { ChevronDownIcon } from "../layout/icons";

const FAQS = [
  {
    question: "How long does delivery take?",
    answer:
      "Orders within Dhaka typically arrive in 1-2 business days. Deliveries to the rest of Bangladesh take 3-5 business days, depending on the courier's coverage in your area.",
  },
  {
    question: "Do you offer cash on delivery?",
    answer:
      "Yes. Cash on delivery is available nationwide alongside card and mobile wallet payments, so you can pay when your order arrives at your door.",
  },
  {
    question: "What is your return policy?",
    answer:
      "Unused items in original condition can be returned within 14 days of delivery for a full refund or exchange. Simply reach out to our support team to start the process.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Once your order ships, you'll receive a tracking link by email and SMS so you can follow its progress in real time until it reaches you.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept major debit/credit cards, mobile wallets (bKash, Nagad, Rocket), and cash on delivery for your convenience.",
  },
  {
    question: "Do you deliver outside Bangladesh?",
    answer:
      "Currently we only ship within Bangladesh. We're working on international shipping and will announce it here as soon as it's available.",
  },
];

function FAQItem({ item, index, isOpen, onToggle }) {
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <div className="border-b border-border">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => onToggle(index)}
          className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
        >
          <span className="text-body font-semibold text-ink">{item.question}</span>
          <ChevronDownIcon
            className={`h-5 w-5 shrink-0 text-ink-secondary transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="pb-5 pr-8 text-small text-ink-secondary">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  function handleToggle(index) {
    setOpenIndex((current) => (current === index ? -1 : index));
  }

  return (
    <section className="bg-bg py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about ordering, delivery and returns."
          align="left"
        />
        <Reveal as="div" className="mx-auto w-full max-w-3xl border-t border-border">
          {FAQS.map((item, index) => (
            <FAQItem
              key={item.question}
              item={item}
              index={index}
              isOpen={openIndex === index}
              onToggle={handleToggle}
            />
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

export default FAQ;
