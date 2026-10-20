import { Link, useParams } from "react-router";
import { Button, Container, SectionHeading, Skeleton } from "../components/common";
import PageBody from "../components/pages/PageBody";
import { usePage } from "../hooks/useContent";
import { formatDate } from "../lib/format";
import { strings } from "../lib/strings";
import { Seo } from "../components/seo";

const t = strings.policy;

function Policy() {
  const { slug } = useParams();
  const { data: page, isPending, isError, refetch } = usePage(slug);
  const others = t.links.filter((l) => l.to !== `/policy/${slug}`);

  if (isPending) {
    return (
      <Container className="max-w-3xl space-y-4 py-section-sm lg:py-section" aria-hidden="true">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-4/5" />
      </Container>
    );
  }

  if (isError || !page) {
    return (
      <Container className="flex flex-col items-center gap-6 py-section-sm text-center lg:py-section">
        <Seo title={isError ? t.failed : t.notFoundTitle} noindex />
        <SectionHeading
          eyebrow={isError ? undefined : strings.notFound.eyebrow}
          title={isError ? t.failed : t.notFoundTitle}
          subtitle={isError ? undefined : t.notFoundText}
        />
        {isError ? (
          <Button variant="secondary" onClick={() => refetch()}>
            {t.retry}
          </Button>
        ) : (
          <Button as={Link} to="/" variant="secondary">
            {strings.notFound.home}
          </Button>
        )}
      </Container>
    );
  }

  return (
    <section className="py-section-sm lg:py-section">
      <Seo title={page.title} description={page.seo_desc || page.content} />
      <Container className="max-w-3xl">
        <SectionHeading as="h1" eyebrow={t.eyebrow} title={page.title} />
        {page.updated_at && <p className="mt-4 text-center text-small text-muted">{t.updated(formatDate(page.updated_at))}</p>}
        <div className="mt-10">
          <PageBody content={page.content} />
        </div>
        <nav aria-label={t.moreTitle} className="mt-14 border-t border-line pt-8">
          <h2 className="text-eyebrow text-brand">{t.moreTitle}</h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
            {others.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="inline-flex min-h-11 items-center text-nav font-semibold text-fg underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </section>
  );
}

export default Policy;
