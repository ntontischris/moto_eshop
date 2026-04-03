import { HeroSection } from "@/components/hero/hero-section";
import { TrustBar } from "@/components/home/trust-bar";
import { BentoCategories } from "@/components/home/bento-categories";
import { FeaturedProducts } from "@/components/home/featured-products";
import { BrandsStrip } from "@/components/home/brands-strip";
import { ReviewsCarousel } from "@/components/home/reviews-carousel";
import { JsonLd } from "@/components/seo/json-ld";
import { generateOrganizationSchema } from "@/lib/schema/organization";
import { generateWebsiteSchema } from "@/lib/schema/website";
import {
  getTopCategories,
  getActiveBrands,
  getFeaturedProducts,
  getActiveBanners,
  getTopReviews,
  getSiteSettings,
} from "@/lib/cache/cached-queries";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

export default async function HomePage() {
  const [categories, brands, products, banners, reviews, settings] =
    await Promise.all([
      getTopCategories(),
      getActiveBrands(),
      getFeaturedProducts(),
      getActiveBanners(),
      getTopReviews(),
      getSiteSettings(),
    ]);

  const trustItems = settings.trust_items as
    | { icon: string; label: string; detail: string }[]
    | undefined;

  return (
    <>
      <JsonLd data={generateOrganizationSchema(BASE_URL)} />
      <JsonLd data={generateWebsiteSchema(BASE_URL)} />
      <HeroSection slides={banners} />
      <TrustBar items={trustItems ?? []} />
      <BentoCategories categories={categories} />
      <FeaturedProducts products={products} />
      <BrandsStrip brands={brands} />
      <ReviewsCarousel reviews={reviews} />
    </>
  );
}
