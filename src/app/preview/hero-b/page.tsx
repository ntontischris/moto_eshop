import Link from "next/link";
import { HeroBVideo } from "@/components/preview/hero-b/hero-b-video";

/**
 * /preview/hero-b — Architecture B
 *
 * Cinematic motorcycle e-shop hero where ALL text overlays, eyebrows, titles,
 * body copy, vignettes, and beat transitions are baked into a single optimized
 * MP4 at build time (see scripts/bake-hero-b.ps1).
 *
 * The page renders only:
 *   1. The full-bleed <video> (with 720p mobile source).
 *   2. 5 absolutely-positioned <Link> CTAs that fade in/out via CSS keyframes
 *      timed to the 15s loop.
 *
 * Tradeoff vs A/C: text cannot change without re-rendering the video, but DOM
 * work and JavaScript cost are minimal — best-case Lighthouse score.
 */

interface CtaConfig {
  href: string;
  label: string;
  // Position class — Tailwind absolute placement.
  position: string;
  // Animation class — one of the 5 beat windows defined in hero-b.css.
  beat: "beat-1a" | "beat-1b" | "beat-2" | "beat-3" | "beat-4" | "beat-5";
}

const CTAS: ReadonlyArray<CtaConfig> = [
  {
    href: "/eksoplismos-anabath",
    label: "Δες τον κατάλογο",
    position:
      "left-1/2 top-[72%] -translate-x-[calc(50%+90px)] sm:-translate-x-[calc(50%+110px)]",
    beat: "beat-1a",
  },
  {
    href: "/prosfores",
    label: "Προσφορές",
    position:
      "left-1/2 top-[72%] translate-x-[calc(-50%+110px)] sm:translate-x-[calc(-50%+130px)]",
    beat: "beat-1b",
  },
  {
    href: "/eksoplismos-anabath/kranh-endoep-nies-kameres",
    label: "Δες κράνη",
    position: "right-[6%] top-[68%]",
    beat: "beat-2",
  },
  {
    href: "/eksoplismos-motosikletas",
    label: "Race & Track",
    position: "left-[6%] top-[68%]",
    beat: "beat-3",
  },
  {
    href: "/eksoplismos-anabath/endysh",
    label: "Δες όλα τα ρούχα",
    position: "right-[6%] top-[68%]",
    beat: "beat-4",
  },
  {
    href: "/eksoplismos-motosikletas",
    label: "Σχετικά με εμάς",
    position: "left-[6%] top-[68%]",
    beat: "beat-5",
  },
] as const;

export default function HeroBPreviewPage() {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      <HeroBVideo />

      {/* CTAs — absolutely positioned, animated via CSS keyframes timed to the 15s loop. */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {CTAS.map((cta) => (
          <Link
            key={`${cta.beat}-${cta.href}`}
            href={cta.href}
            data-beat={cta.beat}
            className={[
              "pointer-events-auto absolute inline-flex items-center justify-center",
              "rounded-full px-6 py-3 text-sm font-semibold tracking-wide",
              "bg-brand-red text-white shadow-lg shadow-brand-red/30",
              "transition-transform hover:scale-105 hover:bg-brand-red-hover",
              "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black",
              "hero-b-cta",
              `hero-b-${cta.beat}`,
              cta.position,
            ].join(" ")}
          >
            {cta.label}
          </Link>
        ))}
      </div>

      <style>{HERO_B_CSS}</style>
    </main>
  );
}

/**
 * CSS-only animation system: each CTA fades in 0.4s after its beat starts,
 * holds, then fades out 0.4s before the beat ends. animation-iteration-count:
 * infinite means it stays in sync with the looping <video>.
 *
 * Loop duration = 15s. Each beat = 3s. Easing intentionally linear so the
 * fade timing tracks the video's drawtext fade exactly.
 */
const HERO_B_CSS = `
@keyframes hero-b-beat-1a {
  0%, 1%   { opacity: 0; transform: translate(calc(-50% - 90px), 8px); }
  4%       { opacity: 1; transform: translate(calc(-50% - 90px), 0); }
  17%      { opacity: 1; transform: translate(calc(-50% - 90px), 0); }
  20%, 100% { opacity: 0; transform: translate(calc(-50% - 90px), 8px); }
}
@keyframes hero-b-beat-1b {
  0%, 1%   { opacity: 0; transform: translate(calc(-50% + 110px), 8px); }
  4%       { opacity: 1; transform: translate(calc(-50% + 110px), 0); }
  17%      { opacity: 1; transform: translate(calc(-50% + 110px), 0); }
  20%, 100% { opacity: 0; transform: translate(calc(-50% + 110px), 8px); }
}
@keyframes hero-b-beat-2 {
  0%, 20%  { opacity: 0; transform: translateY(8px); }
  24%      { opacity: 1; transform: translateY(0); }
  37%      { opacity: 1; transform: translateY(0); }
  40%, 100% { opacity: 0; transform: translateY(8px); }
}
@keyframes hero-b-beat-3 {
  0%, 40%  { opacity: 0; transform: translateY(8px); }
  44%      { opacity: 1; transform: translateY(0); }
  57%      { opacity: 1; transform: translateY(0); }
  60%, 100% { opacity: 0; transform: translateY(8px); }
}
@keyframes hero-b-beat-4 {
  0%, 60%  { opacity: 0; transform: translateY(8px); }
  64%      { opacity: 1; transform: translateY(0); }
  77%      { opacity: 1; transform: translateY(0); }
  80%, 100% { opacity: 0; transform: translateY(8px); }
}
@keyframes hero-b-beat-5 {
  0%, 80%  { opacity: 0; transform: translateY(8px); }
  84%      { opacity: 1; transform: translateY(0); }
  97%      { opacity: 1; transform: translateY(0); }
  100%     { opacity: 0; transform: translateY(8px); }
}
.hero-b-cta {
  opacity: 0;
  animation-duration: 15s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  will-change: opacity, transform;
}
.hero-b-beat-1a { animation-name: hero-b-beat-1a; }
.hero-b-beat-1b { animation-name: hero-b-beat-1b; }
.hero-b-beat-2  { animation-name: hero-b-beat-2; }
.hero-b-beat-3  { animation-name: hero-b-beat-3; }
.hero-b-beat-4  { animation-name: hero-b-beat-4; }
.hero-b-beat-5  { animation-name: hero-b-beat-5; }

@media (prefers-reduced-motion: reduce) {
  .hero-b-cta {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
`;
