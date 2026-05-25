import type { Block } from "../schema";

type Editorial = Extract<Block, { type: "editorial" }>;

export function EditorialBlock({ block }: { block: Editorial }) {
  const imageFirst = block.imagePosition === "left";
  return (
    <section className="container mx-auto grid items-center gap-8 px-4 py-12 md:grid-cols-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.imageUrl}
        alt=""
        className={`w-full rounded-lg object-cover ${imageFirst ? "" : "md:order-last"}`}
      />
      <div className="space-y-4">
        <h2 className="font-russo text-3xl uppercase leading-tight text-white">
          {block.title}
        </h2>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-neutral-300">
          {block.body}
        </p>
      </div>
    </section>
  );
}
