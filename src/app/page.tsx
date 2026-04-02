import { HeroSection } from "@/components/hero/hero-section";
import { TrustBar } from "@/components/home/trust-bar";
import { BentoCategories } from "@/components/home/bento-categories";
import { FeaturedProducts } from "@/components/home/featured-products";
import { BrandsStrip } from "@/components/home/brands-strip";
import { ReviewsCarousel } from "@/components/home/reviews-carousel";
import { JsonLd } from "@/components/seo/json-ld";
import { generateOrganizationSchema } from "@/lib/schema/organization";
import { generateWebsiteSchema } from "@/lib/schema/website";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

export default function HomePage() {
  return (
    <>
      <JsonLd data={generateOrganizationSchema(BASE_URL)} />
      <JsonLd data={generateWebsiteSchema(BASE_URL)} />
      <HeroSection />
      <TrustBar />
      <BentoCategories />
      <FeaturedProducts />
      <BrandsStrip />
      <ReviewsCarousel />
    </>
  );
}
