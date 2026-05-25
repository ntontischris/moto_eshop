import type { Block } from "../schema";

type Faq = Extract<Block, { type: "faq" }>;

export function FaqBlock({ block }: { block: Faq }) {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-12">
      {block.title && (
        <h2 className="mb-6 font-russo text-2xl uppercase text-white">
          {block.title}
        </h2>
      )}
      <div className="space-y-3">
        {block.items.map((item, i) => (
          <details
            key={i}
            className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4"
          >
            <summary className="cursor-pointer text-sm font-bold text-white">
              {item.q}
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
