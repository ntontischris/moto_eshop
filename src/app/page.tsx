import { ScrollVideoHero } from "@/components/hero/scroll-video-hero";
import { TrustBar } from "@/components/home/trust-bar";
import { BentoCategories } from "@/components/home/bento-categories";
import { FeaturedProducts } from "@/components/home/featured-products";
import { BrandsStrip } from "@/components/home/brands-strip";
import { ReviewsCarousel } from "@/components/home/reviews-carousel";
import { AmbientVideoSection } from "@/components/home/ambient-video-section";
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
      <ScrollVideoHero />
      <TrustBar items={trustItems ?? []} />
      <BentoCategories categories={categories} />
      <FeaturedProducts products={products} />

      {/* Ambient #1 — coastal sunset → drives toward riding gear */}
      <AmbientVideoSection
        src="/hero-variants-optimized/3-coastal-sunset.mp4"
        eyebrow="Open road"
        title="Ride. Every road, every season."
        body="Από τη Μάνη μέχρι τα Μετέωρα — εξοπλισμός που σε ακολουθεί σε κάθε διαδρομή. Adventure, touring, αστικό. Με ασφάλεια και στυλ."
        ctaLabel="Δες όλα τα ρούχα"
        ctaHref="/eksoplismos-anabath/endysh"
        heightVh={75}
        align="left"
      />

      <BrandsStrip brands={brands} />

      {/* Ambient #2 — helmet POV → puts user "in the saddle" */}
      <AmbientVideoSection
        src="/hero-variants-optimized/5-helmet-pov.mp4"
        eyebrow="First person"
        title="Δες το με τα μάτια σου."
        body="Πρώτη γραμμή εξοπλισμού: κράνη, ενδοεπικοινωνίες και action cameras. Από τα HJC, Shoei, Caberg και Airoh που εμπιστεύονται οι αναβάτες."
        ctaLabel="Δες κράνη"
        ctaHref="/eksoplismos-anabath/kranh-endoep-nies-kameres"
        heightVh={75}
        align="right"
      />

      {/* Ambient #3 — track action → speaks to performance riders */}
      <AmbientVideoSection
        src="/hero-variants-optimized/4-track-action.mp4"
        eyebrow="Race day"
        title="Track-ready. Day one."
        body="Sport gear που δοκιμάζεται σε πραγματικές πίστες. Από κράνη Full-Face με πιστοποίηση ECE 22.06 μέχρι ελαστικά και αξεσουάρ απόδοσης."
        ctaLabel="Race & Track"
        ctaHref="/eksoplismos-motosikletas"
        heightVh={75}
        align="left"
      />

      <ReviewsCarousel reviews={reviews} />

      {/* Ambient #4 — workshop closeup → craft / authenticity message */}
      <AmbientVideoSection
        src="/hero-variants-optimized/6-workshop.mp4"
        eyebrow="Crafted with care"
        title="Αυθεντικά. Με εγγύηση."
        body="Επίσημοι αντιπρόσωποι των κορυφαίων brands. Κάθε προϊόν που πουλάμε είναι πραγματικό, με εγγύηση κατασκευαστή και υπηρεσίες υποστήριξης από Σίνδο, Αθήνα και Beinoglou 3PL."
        ctaLabel="Σχετικά με εμάς"
        ctaHref="/eksoplismos-motosikletas"
        heightVh={60}
        align="left"
      />
    </>
  );
}
