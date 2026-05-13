/**
 * Internal preview page for comparing AI-generated hero video variants.
 * Not linked from anywhere — open directly at /preview/hero-variants.
 *
 * Six 4-5s clips produced via Higgsfield MCP with different models:
 *   1. cinematic_studio_3_0 (current hero, 720p baseline)
 *   2-3. Veo 3.1 Ultra (4K) — likely winners
 *   4. Seedance 2.0 1080p (action genre)
 *   5. Kling 3.0 pro (helmet POV)
 *   6. cinematic_studio_3_0 (workshop closeup)
 */

interface Variant {
  num: number;
  file: string;
  title: string;
  model: string;
  resolution: string;
  durationSec: number;
  sizeMb: number;
}

const VARIANTS: Variant[] = [
  {
    num: 1,
    file: "/hero-variants/1-mountain-dolly.mp4",
    title: "Mountain dolly (golden hour)",
    model: "cinematic_studio_3_0",
    resolution: "720p",
    durationSec: 4,
    sizeMb: 1.8,
  },
  {
    num: 2,
    file: "/hero-variants/2-urban-night.mp4",
    title: "Athens urban night",
    model: "veo 3.1 ultra",
    resolution: "4K",
    durationSec: 4,
    sizeMb: 30,
  },
  {
    num: 3,
    file: "/hero-variants/3-coastal-sunset.mp4",
    title: "Coastal sunset",
    model: "veo 3.1 ultra",
    resolution: "4K",
    durationSec: 4,
    sizeMb: 21,
  },
  {
    num: 4,
    file: "/hero-variants/4-track-action.mp4",
    title: "Track day action",
    model: "seedance 2.0 1080p",
    resolution: "1080p",
    durationSec: 5,
    sizeMb: 4.4,
  },
  {
    num: 5,
    file: "/hero-variants/5-helmet-pov.mp4",
    title: "Helmet POV ride",
    model: "kling 3.0 pro",
    resolution: "1080p",
    durationSec: 5,
    sizeMb: 17,
  },
  {
    num: 6,
    file: "/hero-variants/6-workshop.mp4",
    title: "Workshop closeup",
    model: "cinematic_studio_3_0",
    resolution: "720p",
    durationSec: 4,
    sizeMb: 0.85,
  },
];

export default function HeroVariantsPreview() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <header className="mb-10">
        <p className="font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
          Internal preview
        </p>
        <h1 className="mt-2 font-russo text-4xl uppercase">
          Hero video variants
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-neutral-400">
          6 AI-generated cinematic clips for the homepage hero. Each video plays
          on hover. Compare resolution, motion, and visual mood, then pick the
          1-3 to wire into the actual scroll-video-hero component.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {VARIANTS.map((v) => (
          <article
            key={v.num}
            className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950"
          >
            <div className="relative aspect-video bg-black">
              <video
                src={v.file}
                muted
                loop
                playsInline
                preload="metadata"
                controls
                className="h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                #{v.num}
              </span>
              <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                {v.resolution}
              </span>
            </div>
            <div className="p-4">
              <h2 className="font-russo text-lg uppercase">{v.title}</h2>
              <p className="mt-1 text-xs text-neutral-500">
                {v.model} · {v.durationSec}s · {v.sizeMb} MB
              </p>
            </div>
          </article>
        ))}
      </div>

      <footer className="mt-12 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <h3 className="font-russo text-sm uppercase tracking-wider text-brand-red">
          Next step
        </h3>
        <p className="mt-2 text-sm text-neutral-400">
          Pick the favorite(s). Three reasonable patterns:
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-neutral-300">
          <li>
            <strong>Single hero swap:</strong> pick 1 winner → replace
            <code className="ml-1 rounded bg-neutral-800 px-1 text-xs">
              hero-source.mp4
            </code>{" "}
            and regenerate frames with <code>pnpm hero:frames</code>.
          </li>
          <li>
            <strong>Hero cycle:</strong> pick 2-3 → cycle them on page load
            (random or sequential) for visit variety.
          </li>
          <li>
            <strong>Multi-section:</strong> pick 3-4 → each section of the
            homepage gets its own ambient mini-hero.
          </li>
        </ul>
      </footer>
    </main>
  );
}
