import { getProductsByIds } from "@/lib/queries/products";
import type { Block } from "../schema";

type Comparison = Extract<Block, { type: "comparison" }>;

export async function ComparisonBlock({ block }: { block: Comparison }) {
  const products = await getProductsByIds(block.productIds);
  if (products.length === 0) return null;
  return (
    <section className="container mx-auto px-4 py-12">
      {block.title && (
        <h2 className="mb-6 font-russo text-2xl uppercase text-white">
          {block.title}
        </h2>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.primary_image_url}
              alt={p.primary_image_alt}
              className="mx-auto mb-3 h-40 w-full object-contain"
            />
            <p className="text-xs uppercase tracking-wider text-neutral-400">
              {p.brand}
            </p>
            <p className="mt-1 text-sm font-bold text-white">{p.name}</p>
            <p className="mt-2 font-russo text-lg text-brand-red">
              €{p.price.toFixed(2)}
            </p>
            {p.average_rating !== null && (
              <p className="mt-1 text-xs text-neutral-400">
                ★ {p.average_rating.toFixed(1)} ({p.review_count})
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
