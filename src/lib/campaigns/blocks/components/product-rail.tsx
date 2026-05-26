import { ProductGrid } from "@/components/product/product-grid";
import {
  getProductsByIds,
  getProductsByCategory,
  getProductsByBrand,
  type ProductListItem,
} from "@/lib/queries/products";
import type { Block } from "../schema";

type Rail = Extract<Block, { type: "productRail" }>;

export async function ProductRailBlock({ block }: { block: Rail }) {
  let products: ProductListItem[] = [];

  if (block.source.mode === "manual") {
    products = await getProductsByIds(block.source.productIds);
  } else if (block.source.by === "category") {
    const res = await getProductsByCategory(
      {
        categorySlug: block.source.value,
        sort: "popular",
        page: 1,
        perPage: block.source.limit,
      },
      "el",
    );
    products = res.data;
  } else if (block.source.by === "brand") {
    products = await getProductsByBrand(block.source.value, block.source.limit);
  }

  if (products.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10">
      {block.title && (
        <h2 className="mb-6 font-russo text-2xl uppercase text-white">
          {block.title}
        </h2>
      )}
      <ProductGrid products={products} />
    </section>
  );
}
