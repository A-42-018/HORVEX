import { Link, useLocation } from "react-router";
import { Container, SectionHeading } from "../components/common";

// Stand-in for storefront pages that aren't built yet. Says which roadmap
// phase delivers the page so nothing pretends to work before it does.
function PagePlaceholder({ title, phase }) {
  const { pathname } = useLocation();

  return (
    <Container className="flex flex-col items-center gap-6 py-section-sm text-center lg:py-section">
      <title>{`${title} | HORVEX`}</title>
      <SectionHeading eyebrow={`Coming in Phase ${phase}`} title={title} subtitle={`Route: ${pathname}`} />
      <Link
        to="/"
        className="text-nav font-semibold text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Back to home
      </Link>
    </Container>
  );
}

export default PagePlaceholder;
