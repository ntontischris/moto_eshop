import Link from "next/link";
import type { Block } from "../schema";

type Hero = Extract<Block, { type: "hero" }>;

export function HeroBlock({ block }: { block: Hero }) {
  return (
    <section className="relative isolate overflow-hidden">
      {block.mediaType === "video" ? (
        <video
          src={block.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.mediaUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-5 px-4 py-20 text-center">
        <h1 className="font-russo text-4xl uppercase leading-tight text-white sm:text-5xl">
          {block.headline}
        </h1>
        {block.subhead && (
          <p className="max-w-xl text-base text-neutral-200">{block.subhead}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={block.primaryCta.href}
            className="rounded-full bg-brand-red px-6 py-3 text-sm font-bold uppercase tracking-wider text-white"
          >
            {block.primaryCta.label}
          </Link>
          {block.secondaryCta && (
            <Link
              href={block.secondaryCta.href}
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white"
            >
              {block.secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
