import { Link } from "react-router";
import { Container, SectionHeading } from "../components/common";

function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-6 py-section-sm text-center lg:py-section">
      <title>Page not found | HORVEX</title>
      <SectionHeading
        eyebrow="404"
        title="This page doesn't exist"
        subtitle="The link may be broken or the page may have moved."
      />
      <Link
        to="/"
        className="text-nav font-semibold text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Back to home
      </Link>
    </Container>
  );
}

export default NotFound;
