import { Link } from "react-router";
import { Container, SectionHeading, Button } from "../common";
import HomeProductGrid from "./HomeProductGrid";
import { useProducts } from "../../hooks/useCatalog";

function BestSellers() {
  const query = useProducts({ bestseller: true, limit: 8 });

  return (
    <section className="bg-bg py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Best Sellers"
          title="What Everyone's Buying"
          subtitle="Our most-loved pieces, chosen by thousands of happy customers."
        />

        <HomeProductGrid query={query} label="Best sellers" />

        <div className="flex justify-center">
          <Button as={Link} to="/shop" variant="outline" size="lg">
            View All Watches
          </Button>
        </div>
      </Container>
    </section>
  );
}

export default BestSellers;
