import type { Block } from "../schema";

type Banner = Extract<Block, { type: "discountBanner" }>;

export function DiscountBannerBlock({ block }: { block: Banner }) {
  return (
    <section className="bg-brand-red px-4 py-4 text-center text-white">
      <p className="text-sm font-bold uppercase tracking-wider">
        {block.text}{" "}
        <span className="rounded bg-white/20 px-2 py-1 font-mono">
          {block.code}
        </span>
      </p>
    </section>
  );
}
