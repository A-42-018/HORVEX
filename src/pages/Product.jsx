import { useParams } from "react-router";
import { Container, Skeleton } from "../components/common";
import { ProductGallery } from "../components/product";
import { useProduct } from "../hooks/useCatalog";
import { strings } from "../lib/strings";
import NotFound from "./NotFound";

// PDP shell. Gallery is B14a; buy box (B15), tabs (B16) and related (B16c) slot into the right column / below.
function Product() {
  const { slug } = useParams();
  const { data: product, isPending, isError, refetch } = useProduct(slug);

  if (isPending) {
    return (
      <Container className="py-8 lg:py-12">
        <Skeleton className="aspect-[4/5] w-full max-w-xl rounded-card" />
      </Container>
    );
  }
  if (isError) {
    return (
      <Container className="py-section-sm text-center">
        <p className="text-body text-muted">{strings.data.loadError}</p>
        <button type="button" onClick={() => refetch()} className="mt-4 text-nav font-semibold underline underline-offset-4">
          {strings.data.retry}
        </button>
      </Container>
    );
  }
  if (!product) return <NotFound />;

  return (
    <>
      <title>{`${product.name} | HORVEX`}</title>
      <Container className="py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          <ProductGallery key={product.id} images={product.images} name={product.name} />
          <div className="mt-8 lg:mt-0">
            <h1 className="text-h2">{product.name}</h1>
          </div>
        </div>
      </Container>
    </>
  );
}

export default Product;
