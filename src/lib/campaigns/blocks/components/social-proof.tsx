import type { Block } from "../schema";

type SocialProof = Extract<Block, { type: "socialProof" }>;

export function SocialProofBlock({ block }: { block: SocialProof }) {
  return (
    <section className="border-y border-neutral-800 bg-neutral-900/40 py-10">
      <div className="container mx-auto px-4">
        {block.title && (
          <h2 className="mb-6 text-center font-russo text-2xl uppercase text-white">
            {block.title}
          </h2>
        )}
        <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {block.stats.map((stat, i) => (
            <div key={i}>
              <p className="font-russo text-3xl text-brand-red">{stat.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-neutral-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
