import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { Container, SectionHeading, Reveal, Skeleton } from "../common";
import { Parallax } from "../motion";
import { useCategories } from "../../hooks/useCatalog";
import { useHomeSections } from "../../hooks/useContent";
import { responsiveImage } from "../../lib/images";
import { staggerDelay } from "../../lib/motion";
import { strings } from "../../lib/strings";

// Shop by Category (roadmap §6.1 #5): 4–5 tall tiles from `categories`
// (visible, top-level, by sort_order). Mobile = horizontal snap scroll showing
// ~1.3 tiles; lg+ = one row. Hover (pointer devices only): image zoom 1.06,
// label slides up, gold arrow appears. On touch the arrow is always visible.
const MAX_TILES = 5;
const CAN_HOVER = "[@media(hover:hover)]";
const TILE_WIDTHS = [320, 480, 640, 800];
const TILE_ASPECT = [3, 4];
const COLS = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" };

// Sized for the list: 77% of the viewport on mobile, a fifth of the container on lg+.
const SIZES = "(min-width: 1024px) 20vw, 77vw";

const listClass = (count) =>
  `-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:snap-none lg:overflow-visible lg:px-0 lg:pb-0 ${COLS[count] ?? COLS[5]}`;
const itemClass = "w-[77%] shrink-0 snap-start sm:w-[45%] lg:w-auto";

function CategoryTile({ category, index }) {
  const img = responsiveImage(category.image, { aspect: TILE_ASPECT, widths: TILE_WIDTHS });

  return (
    <Reveal as="li" delay={staggerDelay(index)} className={itemClass}>
      <Link
        to={`/category/${category.slug}`}
        className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-card bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {img.src && (
          <Parallax>
            <img
              {...img}
              sizes={SIZES}
              alt=""
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-slow ease-out ${CAN_HOVER}:group-hover:scale-[1.06]`}
            />
          </Parallax>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
        />

        {/* tokens-dark keeps the label readable on the photo even in an ivory section */}
        <div
          className={`tokens-dark relative z-10 flex items-end justify-between gap-3 p-5 lg:p-4 xl:p-5 transition-transform duration-base ease-out ${CAN_HOVER}:translate-y-2 ${CAN_HOVER}:group-hover:translate-y-0 group-focus-visible:translate-y-0`}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-h2 text-balance text-fg lg:text-h4">{category.name}</h3>
            <span className="whitespace-nowrap text-button text-muted">{strings.categories.shop}</span>
          </div>
          <ArrowUpRight
            aria-hidden="true"
            size={22}
            strokeWidth={1.5}
            className={`shrink-0 text-brand transition-[transform,opacity] duration-base ${CAN_HOVER}:opacity-0 ${CAN_HOVER}:group-hover:translate-x-0.5 ${CAN_HOVER}:group-hover:opacity-100 group-focus-visible:opacity-100`}
          />
        </div>
      </Link>
    </Reveal>
  );
}

function CategoryShowcase() {
  const { data, isPending } = useCategories();
  const section = useHomeSections().data?.find((s) => s.key === "categories");
  const tiles = (data ?? []).filter((c) => !c.parent_id).slice(0, MAX_TILES);

  // Nothing to show (no visible categories, or a failed load): drop the section
  // rather than leave a heading over an empty row.
  if (!isPending && !tiles.length) return null;

  return (
    <section aria-label={strings.categories.label} className="section-dark py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow={section?.title || strings.categories.eyebrow}
          title={section?.subtitle || strings.categories.title}
          subtitle={strings.categories.subtitle}
        />

        {isPending ? (
          <ul aria-busy="true" aria-label={strings.common.loading} className={listClass(4)}>
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className={itemClass}>
                <Skeleton className="aspect-[3/4] w-full" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className={listClass(tiles.length)}>
            {tiles.map((category, i) => (
              <CategoryTile key={category.id} category={category} index={i} />
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

export default CategoryShowcase;
