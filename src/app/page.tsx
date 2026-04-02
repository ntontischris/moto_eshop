import { HeroSection } from "@/components/hero/hero-section";
import { TrustBar } from "@/components/home/trust-bar";
import { BentoCategories } from "@/components/home/bento-categories";
import { FeaturedProducts } from "@/components/home/featured-products";
import { BrandsStrip } from "@/components/home/brands-strip";
import { ReviewsCarousel } from "@/components/home/reviews-carousel";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <BentoCategories />
      <FeaturedProducts />
      <BrandsStrip />
      <ReviewsCarousel />
    </>
  );
}
