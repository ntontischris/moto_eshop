/**
 * Convert a source MP4 into WebP frames inside public/.
 *
 * Usage:
 *   pnpm hero:frames                                    # hero-source.mp4 → hero-frames/
 *   pnpm hero:frames <src.mp4> <out-dir>                # custom source + output
 *
 * Examples:
 *   pnpm hero:frames public/hero-variants/3-coastal-sunset.mp4 public/scroll-frames/coastal-sunset
 */
import { execSync } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  unlinkSync,
  statSync,
  renameSync,
} from "node:fs";
import { join, isAbsolute } from "node:path";

function abs(p: string): string {
  return isAbsolute(p) ? p : join(process.cwd(), p);
}

const argSrc = process.argv[2];
const argOut = process.argv[3];

const SRC = abs(argSrc ?? "public/hero-source.mp4");
const OUT = abs(argOut ?? "public/hero-frames");

mkdirSync(OUT, { recursive: true });

for (const f of readdirSync(OUT)) {
  if (f.endsWith(".webp") || f.endsWith(".svg")) unlinkSync(join(OUT, f));
}

const cmd = [
  `ffmpeg -y -i "${SRC}"`,
  `-vf "scale=1280:-2,fps=24"`,
  `-c:v libwebp`,
  `-compression_level 4`,
  `-q:v 50`,
  `"${OUT}/%04d.webp"`,
].join(" ");
console.log("→", cmd);
execSync(cmd, { stdio: "inherit" });

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
console.log(`✓ ${sizes.length} frames written → ${OUT}`);
console.log(`  total: ${totalKb.toFixed(0)} KB · avg: ${avgKb.toFixed(1)} KB`);
console.log(`  → FRAME_COUNT: ${sizes.length}`);
