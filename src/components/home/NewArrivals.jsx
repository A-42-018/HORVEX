import { useMemo, useState } from "react";
import { Container, SectionHeading, Reveal } from "../common";
import ProductCard from "./ProductCard";
import products from "../../data/products";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "clothing", label: "Clothing" },
  { id: "accessories", label: "Accessories" },
  { id: "shoes", label: "Shoes" },
];

const newArrivals = products.filter((product) => product.isNewArrival);

function NewArrivals() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") return newArrivals;
    return newArrivals.filter((product) => product.category === activeFilter);
  }, [activeFilter]);

  return (
    <section className="bg-bg-secondary py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="New Arrivals"
          title="Freshly Arrived"
          subtitle="The latest additions to the collection, sorted by category."
        />

        <div
          role="group"
          aria-label="Filter new arrivals by category"
          className="flex flex-wrap justify-center gap-2.5"
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full border px-5 py-2 text-button transition-colors duration-200 ${
                  isActive
                    ? "border-ink bg-ink text-white"
                    : "border-border bg-bg text-ink-secondary hover:border-ink/30 hover:text-ink"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product, i) => (
              <Reveal key={product.id} delay={(i % 4) * 80}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-center text-body text-ink-secondary">
            No new arrivals in this category yet.
          </p>
        )}
      </Container>
    </section>
  );
}

export default NewArrivals;
