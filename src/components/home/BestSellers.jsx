import { Container, SectionHeading, Button, Reveal } from "../common";
import ProductCard from "./ProductCard";
import products from "../../data/products";

function BestSellers() {
  return (
    <section className="bg-bg py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Best Sellers"
          title="What Everyone's Buying"
          subtitle="Our most-loved pieces, chosen by thousands of happy customers."
        />

        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={(i % 4) * 80}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <div className="flex justify-center">
          <Button as="a" href="#" variant="outline" size="lg">
            View All Products
          </Button>
        </div>
      </Container>
    </section>
  );
}

export default BestSellers;
