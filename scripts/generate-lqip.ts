/**
 * Generate LQIP blur-up placeholders for the curated home imagery.
 *
 * For every source in LQIP_SOURCES (local /public paths or remote URLs) this
 * renders a tiny webp via sharp, base64-inlines it as a data URI and records
 * the intrinsic dimensions, then writes the result to
 * src/app/[locale]/(store)/_lib/lqip-manifest.json (committed, so builds
 * never need network access).
 *
 * Run with: pnpm lqip:generate
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import {
  LQIP_SOURCES,
  isLqipEntry,
  type LqipEntry,
} from "../src/app/[locale]/(store)/_lib/lqip";

const PLACEHOLDER_WIDTH = 16;
const WEBP_QUALITY = 40;
const MANIFEST_PATH = join(
  process.cwd(),
  "src/app/[locale]/(store)/_lib/lqip-manifest.json",
);

async function loadSource(src: string): Promise<Buffer> {
  if (src.startsWith("http")) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`fetch ${src} failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(join(process.cwd(), "public", src));
}

async function buildEntry(src: string): Promise<LqipEntry> {
  const input = await loadSource(src);
  const image = sharp(input);
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error(`no dimensions for ${src}`);
  const tiny = await image
    .resize({ width: PLACEHOLDER_WIDTH })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  const entry: LqipEntry = {
    dataUri: `data:image/webp;base64,${tiny.toString("base64")}`,
    width,
    height,
  };
  if (!isLqipEntry(entry)) {
    throw new Error(`generated entry for ${src} violates the LQIP contract`);
  }
  return entry;
}

async function main(): Promise<void> {
  const manifest: Record<string, LqipEntry> = {};
  for (const src of [...LQIP_SOURCES].sort()) {
    manifest[src] = await buildEntry(src);
    console.log(`✓ ${src} (${manifest[src].dataUri.length} chars)`);
  }
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `✓ wrote ${Object.keys(manifest).length} placeholders to ${MANIFEST_PATH}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
