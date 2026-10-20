import { useHomeSections, useSiteSettings } from "../hooks/useContent";
import { organizationLd, websiteLd } from "../lib/seo";
import { JsonLd, SITE_URL, Seo } from "../components/seo";
import {
  Hero,
  TrustMarquee,
  CategoryShowcase,
  FeaturedTabs,
  Anatomy,
  HimHer,
  PromoBanner,
  BrandFilm,
  HowToOrder,
  CustomerReviews,
  SocialShowcase,
  Newsletter,
  FAQ,
} from "../components/home";

// home_sections.key → component. Order and visibility come from the DB
// (RLS only returns visible rows); unknown keys are ignored.
const SECTIONS = {
  hero: Hero,
  trust_marquee: TrustMarquee,
  categories: CategoryShowcase,
  featured: FeaturedTabs,
  anatomy: Anatomy,
  him_her: HimHer,
  brand_film: BrandFilm,
  promo: PromoBanner,
  how_to_order: HowToOrder,
  reviews: CustomerReviews,
  social_grid: SocialShowcase,
  newsletter: Newsletter,
  faq: FAQ,
};

// Spec order (roadmap §6.1); used only while loading or after a failed load. A
// loaded but empty list means every section is hidden, which is honoured.
const DEFAULT_ORDER = [
  "hero",
  "trust_marquee",
  "categories",
  "featured",
  "anatomy",
  "him_her",
  "brand_film",
  "promo",
  "how_to_order",
  "reviews",
  "social_grid",
  "newsletter",
  "faq",
];

function Home() {
  const { data, isError } = useHomeSections();
  const { data: settings } = useSiteSettings();
  const keys =
    !isError && data
      ? [...data].sort((a, b) => a.sort_order - b.sort_order).map((row) => row.key)
      : DEFAULT_ORDER;

  return (
    <>
      <Seo path="/" />
      <JsonLd data={organizationLd(settings, SITE_URL)} />
      <JsonLd data={websiteLd(settings, SITE_URL)} />
      {keys.map((key) => {
        const Section = SECTIONS[key];
        return Section ? <Section key={key} /> : null;
      })}
    </>
  );
}

export default Home;
