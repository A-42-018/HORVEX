import {
  Hero,
  TrustFeatures,
  CategoryShowcase,
  BestSellers,
  PromoBanner,
  NewArrivals,
  BrandStory,
  WhyChooseUs,
  CustomerReviews,
  SocialShowcase,
  Newsletter,
  FAQ,
  FinalCTA,
} from "../components/home";

// Landing page. Sections are still the base template's; Phase 4 rebuilds them
// to the HORVEX spec (roadmap §6.1).
function Home() {
  return (
    <>
      <Hero />
      <TrustFeatures />
      <CategoryShowcase />
      <BestSellers />
      <PromoBanner />
      <NewArrivals />
      <BrandStory />
      <WhyChooseUs />
      <CustomerReviews />
      <SocialShowcase />
      <Newsletter />
      <FAQ />
      <FinalCTA />
    </>
  );
}

export default Home;
