import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { Container } from "../common";
import { strings } from "../../lib/strings";

// Header band for /shop, /category/:slug and /collection/:slug (roadmap §6.3):
// breadcrumb, serif title, product count, short description.
function ListingHeader({ title, description, count, crumbs = [] }) {
  return (
    <header className="section-dark border-b border-line">
      <Container className="flex flex-col gap-4 py-10 md:py-14">
        <nav aria-label={strings.listing.breadcrumb}>
          <ol className="flex flex-wrap items-center gap-1.5 text-small text-muted">
            <li>
              <Link to="/" className="underline-offset-4 hover:text-fg hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                {strings.listing.home}
              </Link>
            </li>
            {crumbs.map((crumb) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                <ChevronRight aria-hidden="true" size={14} strokeWidth={1.5} />
                {crumb.to ? (
                  <Link to={crumb.to} className="underline-offset-4 hover:text-fg hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-fg">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-h1 text-fg">{title}</h1>
        {typeof count === "number" && <p className="text-eyebrow">{strings.listing.count(count)}</p>}
        {description && <p className="max-w-2xl text-body text-muted">{description}</p>}
      </Container>
    </header>
  );
}

export default ListingHeader;
