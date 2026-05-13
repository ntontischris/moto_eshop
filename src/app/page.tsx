import { ScrollVideoHero } from "@/components/hero/scroll-video-hero";
import { TrustBar } from "@/components/home/trust-bar";
import { BentoCategories } from "@/components/home/bento-categories";
import { FeaturedProducts } from "@/components/home/featured-products";
import { BrandsStrip } from "@/components/home/brands-strip";
import { ReviewsCarousel } from "@/components/home/reviews-carousel";
import { ScrollVideoSection } from "@/components/scroll-video/scroll-video-section";
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

      {/* Scroll-driven section #1 — coastal sunset */}
      <ScrollVideoSection
        framesPath="/scroll-frames/coastal-sunset"
        frameCount={96}
        scrollHeightVh={150}
        eyebrow="Open road"
        title="Ride. Every road, every season."
        body="Από τη Μάνη μέχρι τα Μετέωρα — εξοπλισμός που σε ακολουθεί σε κάθε διαδρομή. Adventure, touring, αστικό. Με ασφάλεια και στυλ."
        ctaLabel="Δες όλα τα ρούχα"
        ctaHref="/eksoplismos-anabath/endysh"
        align="left"
      />

      <BrandsStrip brands={brands} />

      {/* Scroll-driven section #2 — urban night (replaces helmet POV, now hero) */}
      <ScrollVideoSection
        framesPath="/scroll-frames/urban-night"
        frameCount={96}
        scrollHeightVh={150}
        eyebrow="City lights"
        title="Νύχτα. Φώτα. Δρόμος."
        body="Κράνη, ενδοεπικοινωνίες και φωτισμός για ασφάλεια όταν η πόλη ξυπνά. HJC, Shoei, Caberg, Airoh — εμπιστευμένα από αναβάτες σε όλη την Ελλάδα."
        ctaLabel="Δες κράνη"
        ctaHref="/eksoplismos-anabath/kranh-endoep-nies-kameres"
        align="right"
      />

      {/* Scroll-driven section #3 — track action */}
      <ScrollVideoSection
        framesPath="/scroll-frames/track-action"
        frameCount={121}
        scrollHeightVh={150}
        eyebrow="Race day"
        title="Track-ready. Day one."
        body="Sport gear που δοκιμάζεται σε πραγματικές πίστες. Από κράνη Full-Face με πιστοποίηση ECE 22.06 μέχρι ελαστικά και αξεσουάρ απόδοσης."
        ctaLabel="Race & Track"
        ctaHref="/eksoplismos-motosikletas"
        align="left"
      />

      <ReviewsCarousel reviews={reviews} />

      {/* Scroll-driven section #4 — workshop closeup */}
      <ScrollVideoSection
        framesPath="/scroll-frames/workshop"
        frameCount={97}
        scrollHeightVh={120}
        eyebrow="Crafted with care"
        title="Αυθεντικά. Με εγγύηση."
        body="Επίσημοι αντιπρόσωποι των κορυφαίων brands. Κάθε προϊόν που πουλάμε είναι πραγματικό, με εγγύηση κατασκευαστή και υπηρεσίες υποστήριξης από Σίνδο, Αθήνα και Beinoglou 3PL."
        ctaLabel="Σχετικά με εμάς"
        ctaHref="/eksoplismos-motosikletas"
        align="left"
      />
    </>
  );
}
