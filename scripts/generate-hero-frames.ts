/**
 * Convert public/hero-source.mp4 into WebP frames in public/hero-frames/.
 *
 * Source is 1280x720 24fps 4s = 97 frames. We extract every frame and
 * scale to 1920px wide. Each WebP targets ~80 KB via -q:v 60.
 *
 * After running, the actual frame count is logged so the hero component
 * can be aligned to it (see FRAME_COUNT in scroll-video-hero.tsx).
 */
import { execSync } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  unlinkSync,
  statSync,
  renameSync,
} from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "public", "hero-source.mp4");
const OUT = join(process.cwd(), "public", "hero-frames");

mkdirSync(OUT, { recursive: true });

// Remove any stale .webp or .svg before regenerating
for (const f of readdirSync(OUT)) {
  if (f.endsWith(".webp") || f.endsWith(".svg")) unlinkSync(join(OUT, f));
}

// Extract every source frame as 1920-wide WebP. ffmpeg writes 1-indexed
// %04d output (0001..NNNN); we'll renumber to 0-indexed below.
//
// -c:v libwebp forces single-frame WebPs (otherwise libwebp_anim creates one
// animated WebP for the whole sequence which is not what we want).
// -compression_level 4 keeps file sizes ~50-100 KB at -q:v 60 quality.
const cmd = [
  `ffmpeg -y -i "${SRC}"`,
  `-vf "scale=1920:-2,fps=24"`,
  `-c:v libwebp`,
  `-compression_level 4`,
  `-q:v 60`,
  `"${OUT}/%04d.webp"`,
].join(" ");
console.log("→", cmd);
execSync(cmd, { stdio: "inherit" });

// Renumber from 1-indexed to 0-indexed so the hero component's frame[0..]
// addressing is consistent.
const sorted = readdirSync(OUT)
  .filter((f) => f.endsWith(".webp"))
  .sort();
sorted.forEach((f, i) => {
  const desired = `${String(i).padStart(4, "0")}.webp`;
  if (f !== desired) renameSync(join(OUT, f), join(OUT, desired));
});

const sizes = readdirSync(OUT)
  .filter((f) => f.endsWith(".webp"))
  .map((f) => statSync(join(OUT, f)).size);
const totalKb = sizes.reduce((a, b) => a + b, 0) / 1024;
const avgKb = totalKb / sizes.length;
console.log(`✓ ${sizes.length} frames written`);
console.log(`  total: ${totalKb.toFixed(0)} KB · avg: ${avgKb.toFixed(1)} KB`);
console.log(
  `  → Update FRAME_COUNT in src/components/hero/scroll-video-hero.tsx to ${sizes.length}`,
);
