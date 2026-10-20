import { Link } from "react-router";
import { Gem, HandCoins, ScanSearch, ShieldCheck } from "lucide-react";
import { Button, Container, Reveal, SectionHeading, Skeleton } from "../components/common";
import PageBody from "../components/pages/PageBody";
import { usePage } from "../hooks/useContent";
import { strings } from "../lib/strings";

const t = strings.about;
const ICONS = [ScanSearch, Gem, HandCoins, ShieldCheck];

function About() {
  const { data: page, isPending } = usePage("about");
  const title = page?.title || t.title;

  return (
    <>
      <title>{`${title} | HORVEX`}</title>
      {page?.seo_desc && <meta name="description" content={page.seo_desc} />}

      <section className="py-section-sm lg:py-section">
        <Container className="max-w-3xl">
          <SectionHeading as="h1" eyebrow={t.eyebrow} title={title} />
          <div className="mt-10">
            {isPending ? (
              <div className="space-y-3" aria-hidden="true">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-11/12" />
                <Skeleton className="h-5 w-4/5" />
              </div>
            ) : page?.content ? (
              <PageBody content={page.content} />
            ) : (
              <p className="text-center text-body text-muted">{t.fallbackIntro}</p>
            )}
          </div>
        </Container>
      </section>

      <section aria-labelledby="about-values" className="section-ivory bg-surface py-section-sm lg:py-section">
        <Container>
          <SectionHeading id="about-values" eyebrow={t.valuesEyebrow} title={t.valuesTitle} />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.values.map((v, i) => {
              const Icon = ICONS[i];
              return (
                <Reveal as="li" key={v.title} delay={i * 80} className="rounded-card border border-line bg-raised p-6">
                  <Icon size={28} strokeWidth={1.5} aria-hidden="true" className="text-brand" />
                  <h3 className="mt-4 text-h3 text-fg">{v.title}</h3>
                  <p className="mt-2 text-small text-muted">{v.text}</p>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </section>

      <section className="py-section-sm lg:py-section">
        <Container className="flex flex-col items-center gap-6 text-center">
          <SectionHeading title={t.ctaTitle} subtitle={t.ctaText} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to="/shop" size="lg">
              {t.shop}
            </Button>
            <Button as={Link} to="/contact" variant="secondary" size="lg">
              {t.contact}
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

export default About;
