import { SectionHeading } from "../common";
import { useRelatedProducts } from "../../hooks/useCatalog";
import { strings } from "../../lib/strings";
import ProductGrid from "./ProductGrid";

const LIMIT = 4;

// "You may also like" below the PDP tabs. Hidden when nothing else is in the catalogue.
function RelatedProducts({ product }) {
  const query = useRelatedProducts(product, LIMIT);
  if (query.isSuccess && !query.data.items.length) return null;

  const { related } = strings.product;
  return (
    <section aria-labelledby="related-heading" className="mt-16 lg:mt-24">
      <SectionHeading id="related-heading" eyebrow={related.eyebrow} title={related.title} />
      <div className="mt-8 lg:mt-10">
        <ProductGrid query={query} skeletons={LIMIT} label={related.label} reveal={false} />
      </div>
    </section>
  );
}

export default RelatedProducts;
