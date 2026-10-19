import { useState } from "react";
import { Container, SectionHeading } from "../common";
import HomeProductGrid from "./HomeProductGrid";
import { useProducts } from "../../hooks/useCatalog";

const FILTERS = [
  { id: null, label: "All" },
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
];

function NewArrivals() {
  const [gender, setGender] = useState(null);
  const query = useProducts({ gender, sort: "newest", limit: 8 });

  return (
    <section className="bg-bg-secondary py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="New Arrivals"
          title="Freshly Arrived"
          subtitle="The latest additions to the collection."
        />

        <div role="group" aria-label="Filter new arrivals" className="flex flex-wrap justify-center gap-2.5">
          {FILTERS.map((filter) => {
            const isActive = gender === filter.id;
            return (
              <button
                key={filter.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => setGender(filter.id)}
                className={`min-h-11 rounded-full border px-5 py-2 text-button transition-colors duration-200 ${
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

        <HomeProductGrid query={query} label="New arrivals" />
      </Container>
    </section>
  );
}

export default NewArrivals;
