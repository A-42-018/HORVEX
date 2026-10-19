import { Link } from "react-router";
import { SearchX } from "lucide-react";
import { Button } from "../common";
import { strings } from "../../lib/strings";

// Empty state: "Clear filters" when the URL carries a view, otherwise a way back to /shop.
function ListingEmpty({ hasParams, onClear }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <SearchX aria-hidden="true" size={40} strokeWidth={1.5} className="text-muted" />
      <h2 className="text-h3 text-fg">{strings.listing.emptyTitle}</h2>
      <p className="max-w-sm text-body text-muted">{strings.listing.emptyText}</p>
      {hasParams ? (
        <Button variant="secondary" onClick={onClear}>{strings.listing.clearFilters}</Button>
      ) : (
        <Button as={Link} to="/shop" variant="secondary">{strings.listing.browseAll}</Button>
      )}
    </div>
  );
}

export default ListingEmpty;
