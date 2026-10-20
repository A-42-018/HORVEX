import { Link } from "react-router";
import { Button, Container, SectionHeading } from "../components/common";
import { strings } from "../lib/strings";
import { Seo } from "../components/seo";

const t = strings.notFound;

function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-8 py-section-sm text-center lg:py-section">
      <Seo title={t.title} noindex />
      <SectionHeading as="h1" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button as={Link} to="/" size="lg">
          {t.home}
        </Button>
        <Button as={Link} to="/shop" variant="secondary" size="lg">
          {t.shop}
        </Button>
      </div>
      <nav aria-label={t.helpTitle} className="flex flex-col items-center gap-2">
        <p className="text-small text-muted">{t.helpTitle}</p>
        <ul className="flex flex-wrap justify-center gap-x-6">
          {t.links.map((l) => (
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
  );
}

export default NotFound;
