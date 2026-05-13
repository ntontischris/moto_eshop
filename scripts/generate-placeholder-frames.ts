/**
 * Emit 120 SVG placeholder frames so the hero renders before the
 * real Higgsfield video lands. Each frame is a dark gradient with
 * the frame number stamped on it — purely a visual stand-in.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const FRAME_COUNT = 120;
const OUT = join(process.cwd(), "public", "hero-frames");
mkdirSync(OUT, { recursive: true });

function svgFor(i: number): string {
  const hue = 0; // red family
  const lightness = 8 + Math.round((i / FRAME_COUNT) * 22); // 8% → 30%
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 60%, ${lightness}%)"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#g)"/>
  <text x="960" y="540" text-anchor="middle" fill="#fff" opacity="0.4"
        font-family="monospace" font-size="48">
    placeholder frame ${i + 1} / ${FRAME_COUNT}
  </text>
</svg>`;
}

for (let i = 0; i < FRAME_COUNT; i++) {
  const num = String(i).padStart(4, "0");
  writeFileSync(join(OUT, `${num}.svg`), svgFor(i));
}
console.log(`✓ wrote ${FRAME_COUNT} placeholder SVG frames to ${OUT}`);
