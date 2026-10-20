import { ChevronDown } from "lucide-react";

// One accordion row, shared by the home FAQ and the /faq page. Surface-aware tokens
// make it work on both dark and ivory sections.
function FaqItem({ item, isOpen, onToggle, uid }) {
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

export default FaqItem;
