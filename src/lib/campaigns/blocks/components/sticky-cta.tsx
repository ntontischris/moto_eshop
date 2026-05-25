import Link from "next/link";
import type { Block } from "../schema";

type StickyCta = Extract<Block, { type: "stickyCta" }>;

export function StickyCtaBlock({ block }: { block: StickyCta }) {
  return (
    <div className="sticky bottom-0 z-40 border-t border-neutral-800 bg-black/90 p-3 backdrop-blur md:hidden">
      <Link
        href={block.href}
        className="block rounded-full bg-brand-red py-3 text-center text-sm font-bold uppercase tracking-wider text-white"
      >
        {block.label}
      </Link>
    </div>
  );
}
