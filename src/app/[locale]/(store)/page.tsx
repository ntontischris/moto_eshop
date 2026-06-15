import type { Metadata } from "next";
import dynamic from "next/dynamic";
import type { Locale } from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { getProductsByCategory } from "@/lib/queries/products";
import { Hero } from "./_components/home/hero";
import { RaceControlPanel } from "./_components/home/race-control-panel";
import {
  CategoryShortcutGrid,
  type ShortcutItem,
} from "./_components/home/category-shortcut-grid";
import { GearTunnel } from "./_components/home/gear-tunnel";
import { OffersSection } from "./_components/home/offers-section";
import { SocialProof } from "./_components/home/social-proof";
import { MyBikeEntry } from "./_components/home/my-bike-entry";
import { BrandCarousel } from "./_components/home/brand-carousel";
import { NewsletterBand } from "./_components/home/newsletter-band";
import { EditorialBand } from "./_components/home/editorial-band";
import { TrustBlock } from "./_components/shell/trust-block";
import { Reveal } from "./_components/fx/reveal";
import { SpeedometerPreloader } from "./_components/fx/speedometer-preloader";

// Below-the-fold home section: deferred so its colocated nour-gallery CSS
// code-splits off the home critical path (S5a, issue #86). SSR stays on so the
// rail still renders server-side and search engines see it.
const ProductRail = dynamic(() =>
  import("./_components/home/product-rail").then((m) => m.ProductRail),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("homeMetaTitle"),
    description: t("homeMetaDesc"),
  };
}

export default async function V3Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const SHORTCUTS: ShortcutItem[] = [
    {
      label: t("shortcutHelmet"),
      href: "/category/eksoplismos-anabath",
      valid: true,
      brief: "ECE 22.06 / full face / modular",
      imageKey: "helmet",
    },
    {
      label: t("shortcutJacket"),
      href: "/category/endysh--mpoyfan",
      valid: true,
      brief: "Leather / textile / air",
      imageKey: "apparel",
    },
    {
      label: t("shortcutGloves"),
      href: "/category/endysh--gantia",
      valid: true,
      brief: "Track grip / daily control",
      imageKey: "gloves",
    },
    {
      label: t("shortcutBoots"),
      href: "/category/endysh--mpotes",
      valid: true,
      brief: "Sport / touring / waterproof",
      imageKey: "boots",
    },
    {
      label: t("shortcutLuggage"),
      href: "/category/eksoplismos-motosikletas",
      valid: true,
      brief: "Top case / side cases",
      imageKey: "topCase",
    },
    {
      label: t("shortcutConsumables"),
      href: "/category/lipantika",
      valid: true,
      brief: t("shortcutConsumablesBrief"),
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

  const TUNNEL_CARDS = [
    {
      label: t("shortcutHelmet"),
      href: "/category/eksoplismos-anabath",
      brief: "ECE 22.06 / full face / modular",
      src: "/category-atelier/helmets.webp",
    },
    {
      label: t("shortcutJacket"),
      href: "/category/endysh--mpoyfan",
      brief: "Leather / textile / air",
      src: "/category-atelier/jackets.webp",
    },
    {
      label: t("shortcutGloves"),
      href: "/category/endysh--gantia",
      brief: "Track grip / daily control",
      src: "/category-atelier/gloves.webp",
    },
    {
      label: t("shortcutBoots"),
      href: "/category/endysh--mpotes",
      brief: "Sport / touring / waterproof",
      src: "/category-atelier/boots.webp",
    },
    {
      label: t("shortcutLuggage"),
      href: "/category/eksoplismos-motosikletas",
      brief: "Top case / side cases",
      src: "/category-atelier/luggage.webp",
    },
  ];

  const [bestRes, offersRes] = await Promise.all([
    getProductsByCategory(
      {
        categorySlug: "eksoplismos-anabath",
        perPage: 16,
        sort: "popular",
      },
      locale,
    ),
    getProductsByCategory(
      {
        categorySlug: "eksoplismos-anabath",
        perPage: 8,
        sort: "newest",
      },
      locale,
    ),
  ]);

  return (
    <div className="v3-home-reconstruction v3-home-ride-commerce">
      <SpeedometerPreloader />
      <Hero />
      <Reveal>
        <RaceControlPanel />
      </Reveal>
      <Reveal>
        <CategoryShortcutGrid items={SHORTCUTS} />
      </Reveal>
      <GearTunnel cards={TUNNEL_CARDS} />
      <Reveal>
        <ProductRail
          title={t("homeTitleFirst")}
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
