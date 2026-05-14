import { UnifiedScrollVideo } from "@/components/hero/unified-scroll-video";
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

      {/* Single 10s 16:9 cinematic video drives the entire hero experience.
          Full-bleed video with alternating L/R overlay panels at scroll
          progress beats. */}
      <UnifiedScrollVideo
        framesPath="/scroll-frames/cinematic-hero"
        frameCount={361}
        scrollHeightVh={1500}
        beats={[
          {
            range: [0.0, 0.1],
            position: "center",
            eyebrow: "Race-grade equipment",
            title: (
              <>
                Ride. <span className="text-brand-red">Protected.</span>
              </>
            ),
            body: "Επίσημοι αντιπρόσωποι κορυφαίων brands εξοπλισμού μοτοσικλέτας. Από κράνη και ενδοεπικοινωνίες μέχρι ολοκληρωμένες λύσεις touring, sport και adventure.",
            ctas: [
              { label: "Δες τον κατάλογο", href: "/eksoplismos-anabath" },
              {
                label: "Προσφορές",
                href: "/prosfores",
                variant: "ghost",
              },
            ],
          },
          {
            range: [0.13, 0.3],
            position: "right",
            eyebrow: "City lights",
            title: "Νύχτα. Φώτα. Δρόμος.",
            body: "Κράνη, ενδοεπικοινωνίες και φωτισμός για ασφάλεια όταν η πόλη ξυπνά. HJC, Shoei, Caberg, Airoh — εμπιστευμένα από αναβάτες σε όλη την Ελλάδα.",
            ctas: [
              {
                label: "Δες κράνη",
                href: "/eksoplismos-anabath/kranh-endoep-nies-kameres",
              },
            ],
          },
          {
            range: [0.34, 0.55],
            position: "left",
            eyebrow: "Race day",
            title: "Track-ready. Day one.",
            body: "Sport gear που δοκιμάζεται σε πραγματικές πίστες. Από κράνη Full-Face με πιστοποίηση ECE 22.06 μέχρι ελαστικά και αξεσουάρ απόδοσης.",
            ctas: [
              { label: "Race & Track", href: "/eksoplismos-motosikletas" },
            ],
          },
          {
            range: [0.6, 0.82],
            position: "right",
            eyebrow: "Open road",
            title: "Ride. Every road, every season.",
            body: "Από τη Μάνη μέχρι τα Μετέωρα — εξοπλισμός που σε ακολουθεί σε κάθε διαδρομή. Adventure, touring, αστικό. Με ασφάλεια και στυλ.",
            ctas: [
              {
                label: "Δες όλα τα ρούχα",
                href: "/eksoplismos-anabath/endysh",
              },
            ],
          },
          {
            range: [0.86, 0.98],
            position: "left",
            eyebrow: "Crafted with care",
            title: "Αυθεντικά. Με εγγύηση.",
            body: "Επίσημοι αντιπρόσωποι των κορυφαίων brands. Κάθε προϊόν που πουλάμε είναι πραγματικό, με εγγύηση κατασκευαστή και υπηρεσίες υποστήριξης από Σίνδο, Αθήνα και Beinoglou 3PL.",
            ctas: [
              { label: "Σχετικά με εμάς", href: "/eksoplismos-motosikletas" },
            ],
          },
        ]}
      />

      <TrustBar items={trustItems ?? []} />
      <BentoCategories categories={categories} />
      <FeaturedProducts products={products} />
      <BrandsStrip brands={brands} />
      <ReviewsCarousel reviews={reviews} />
    </>
  );
}
