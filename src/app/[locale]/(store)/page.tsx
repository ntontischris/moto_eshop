import type { Metadata } from "next";
import { getProductsByCategory } from "@/lib/queries/products";
import { Hero } from "./_components/home/hero";
import { RaceControlPanel } from "./_components/home/race-control-panel";
import {
  CategoryShortcutGrid,
  type ShortcutItem,
} from "./_components/home/category-shortcut-grid";
import { ProductRail } from "./_components/home/product-rail";
import { OffersSection } from "./_components/home/offers-section";
import { SocialProof } from "./_components/home/social-proof";
import { MyBikeEntry } from "./_components/home/my-bike-entry";
import { BrandCarousel } from "./_components/home/brand-carousel";
import { NewsletterBand } from "./_components/home/newsletter-band";
import { EditorialBand } from "./_components/home/editorial-band";
import { TrustBlock } from "./_components/shell/trust-block";
import { Reveal } from "./_components/fx/reveal";

export const metadata: Metadata = {
  title: "MotoMarket | Premium εξοπλισμός μοτοσυκλέτας",
  description:
    "Κράνη, μπουφάν, γάντια, μπότες, αξεσουάρ και ανταλλακτικά μοτοσυκλέτας από επίσημα brands.",
};

const SHORTCUTS: ShortcutItem[] = [
  {
    label: "Κράνη",
    href: "/category/eksoplismos-anabath",
    valid: true,
    brief: "ECE 22.06 / full face / modular",
    imageKey: "helmet",
  },
  {
    label: "Μπουφάν",
    href: "/category/endysh--mpoyfan",
    valid: true,
    brief: "Leather / textile / air",
    imageKey: "apparel",
  },
  {
    label: "Γάντια",
    href: "/category/endysh--gantia",
    valid: true,
    brief: "Track grip / daily control",
    imageKey: "gloves",
  },
  {
    label: "Μπότες",
    href: "/category/endysh--mpotes",
    valid: true,
    brief: "Sport / touring / waterproof",
    imageKey: "boots",
  },
  {
    label: "Βαλίτσες",
    href: "/category/eksoplismos-motosikletas",
    valid: true,
    brief: "Top case / side cases",
    imageKey: "topCase",
  },
  {
    label: "Αναλώσιμα",
    href: "/category/lipantika",
    valid: true,
    brief: "Λάδια / chain care / χημικά",
    imageKey: "exhaust",
  },
  {
    label: "Quad Lock",
    href: "/search?q=Quad%20Lock",
    valid: true,
    brief: "Phone cockpit",
    imageKey: "helmetFront",
  },
  {
    label: "Off-road",
    href: "/category/off-road",
    valid: true,
    brief: "Enduro / adventure",
    imageKey: "tyre",
  },
];

export default async function V3Home() {
  const [bestRes, offersRes] = await Promise.all([
    getProductsByCategory({
      categorySlug: "eksoplismos-anabath",
      perPage: 16,
      sort: "popular",
    }),
    getProductsByCategory({
      categorySlug: "eksoplismos-anabath",
      perPage: 8,
      sort: "newest",
    }),
  ]);

  return (
    <div className="v3-home-reconstruction v3-home-ride-commerce">
      <Hero />
      <Reveal>
        <RaceControlPanel />
      </Reveal>
      <Reveal>
        <CategoryShortcutGrid items={SHORTCUTS} />
      </Reveal>
      <Reveal>
        <ProductRail
          title="Πρώτες επιλογές αναβάτη"
          products={bestRes.data}
          href="/category/eksoplismos-anabath"
        />
      </Reveal>
      <Reveal>
        <EditorialBand />
      </Reveal>
      <Reveal>
        <OffersSection products={offersRes.data} />
      </Reveal>
      <Reveal>
        <SocialProof />
      </Reveal>
      <Reveal>
        <MyBikeEntry />
      </Reveal>
      <Reveal>
        <BrandCarousel />
      </Reveal>
      <Reveal>
        <NewsletterBand />
      </Reveal>
      <Reveal>
        <TrustBlock />
      </Reveal>
    </div>
  );
}
