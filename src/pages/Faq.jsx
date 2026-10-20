import { useId, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button, Container, SectionHeading, Skeleton } from "../components/common";
import FaqItem from "../components/faq/FaqItem";
import { useFaqs } from "../hooks/useContent";
import { strings } from "../lib/strings";

const t = strings.faqPage;

// Groups rows by `topic`, keeping first-seen order (rows arrive sorted by sort_order).
function groupByTopic(items) {
  const groups = new Map();
  for (const item of items) {
    const topic = item.topic?.trim() || t.otherTopic;
    if (!groups.has(topic)) groups.set(topic, []);
    groups.get(topic).push(item);
  }
  return [...groups];
}

function Faq() {
  const uid = useId();
  const [openId, setOpenId] = useState(null);
  const { data: faqs, isPending, isError, refetch } = useFaqs();
  const groups = useMemo(() => groupByTopic(faqs ?? []), [faqs]);

  return (
    <section className="py-section-sm lg:py-section">
      <title>{`${t.title} | WRISTORY`}</title>
      <meta name="description" content={t.subtitle} />
      <Container className="flex max-w-3xl flex-col gap-10 lg:gap-12">
        <SectionHeading as="h1" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />

        {isPending ? (
          <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div role="alert" className="flex flex-col items-center gap-4 text-center">
            <p className="text-body text-muted">{t.failed}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              {t.retry}
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <p className="text-center text-body text-muted">{t.empty}</p>
        ) : (
          groups.map(([topic, items], gi) => (
            <div key={topic}>
              {/* A single "General" group needs no sub-heading. */}
              {(groups.length > 1 || topic !== t.otherTopic) && (
                <h2 className="mb-2 text-eyebrow text-brand">{topic}</h2>
              )}
              <div className="border-t border-line">
                {items.map((item) => (
                  <FaqItem
                    key={item.id}
                    item={item}
                    uid={`${uid}-${gi}-${item.id}`}
                    isOpen={openId === item.id}
                    onToggle={() => setOpenId((cur) => (cur === item.id ? null : item.id))}
                  />
                ))}
              </div>
            </div>
          ))
        )}

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

export default Faq;
