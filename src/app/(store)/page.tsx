import type { Metadata } from "next";
import { getCategoryTree } from "@/lib/queries/categories";
import { getProductsByCategory } from "@/lib/queries/products";
import { Hero } from "./_components/home/hero";
import {
  CategoryShortcutGrid,
  type ShortcutItem,
} from "./_components/home/category-shortcut-grid";
import { ProductRail } from "./_components/home/product-rail";
import { OffersSection } from "./_components/home/offers-section";
import { MyBikeEntry } from "./_components/home/my-bike-entry";
import { BrandCarousel } from "./_components/home/brand-carousel";
import { HeritageStrip } from "./_components/home/heritage-strip";
import { EditorialBand } from "./_components/home/editorial-band";
import { TrustBlock } from "./_components/shell/trust-block";
import { Reveal } from "./_components/fx/reveal";

export const metadata: Metadata = {
  title: "MotoMarket — Εξοπλισμός μηχανής & αναβάτη",
  description:
    "Κράνη, μπουφάν, γάντια, μπότες και αξεσουάρ από επίσημους προμηθευτές.",
};

const SHORTCUTS: { label: string; match: string }[] = [
  { label: "Κράνη", match: "eksoplismos-anabath" },
  { label: "Μπουφάν", match: "endysh--mpoyfan" },
  { label: "Γάντια", match: "endysh--gantia" },
  { label: "Μπότες", match: "endysh--mpotes" },
  { label: "Βαλίτσες", match: "eksoplismos-motosikletas" },
  { label: "Λιπαντικά", match: "lipantika" },
  { label: "Quad Lock", match: "aksesoyar" },
  { label: "Off-road", match: "off-road" },
];

function collectSlugs(
  nodes: { slug: string; children: unknown[] }[],
): string[] {
  return nodes.flatMap((n) => [
    n.slug,
    ...collectSlugs(
      (n.children as { slug: string; children: unknown[] }[]) ?? [],
    ),
  ]);
}

export default async function V3Home() {
  const tree = await getCategoryTree();
  const flat = new Set(collectSlugs(tree));

  const [bestRes, offersRes] = await Promise.all([
    getProductsByCategory({
      categorySlug: "eksoplismos-anabath",
      perPage: 10,
      sort: "popular",
    }),
    getProductsByCategory({
      categorySlug: "eksoplismos-anabath",
      perPage: 10,
      sort: "newest",
    }),
  ]);

  const shortcuts: ShortcutItem[] = SHORTCUTS.map((s) => ({
    label: s.label,
    href: `/category/${s.match}`,
    valid: flat.has(s.match),
  }));

  return (
    <>
      <Hero />
      <Reveal>
        <CategoryShortcutGrid items={shortcuts} />
      </Reveal>
      <Reveal>
        <ProductRail
          title="Δημοφιλή"
          products={bestRes.data}
          href="/category/eksoplismos-anabath"
        />
      </Reveal>
      <EditorialBand />
      <Reveal>
        <OffersSection products={offersRes.data} />
      </Reveal>
      <Reveal>
        <MyBikeEntry />
      </Reveal>
      <Reveal>
        <BrandCarousel />
      </Reveal>
      <Reveal>
        <HeritageStrip />
      </Reveal>
      <Reveal>
        <TrustBlock />
      </Reveal>
    </>
  );
}
