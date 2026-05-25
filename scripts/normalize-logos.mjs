import sharp from "sharp";
import { readdirSync, unlinkSync } from "node:fs";
import { join, parse } from "node:path";

const H = 160; // normalized logo height (retina source; displayed ~32-44px)
const PAD = 16; // uniform breathing room

async function normalizeGear(dir) {
  // mixed svg/png, baked white/black bg, colored content -> trimmed white-bg PNG
  const files = readdirSync(dir).filter((f) => /\.(png|svg)$/i.test(f));
  for (const f of files) {
    const { name } = parse(f);
    const src = join(dir, f);
    const out = join(dir, `${name}.png`);
    const buf = await sharp(src, { density: 300 })
      .flatten({ background: "#ffffff" })
      .trim({ background: "#ffffff", threshold: 14 })
      .resize({ height: H, fit: "inside", withoutEnlargement: false })
      .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: "#ffffff" })
      .png({ compressionLevel: 9 })
      .toBuffer();
    if (f.endsWith(".svg")) unlinkSync(src); // drop original svg
    await sharp(buf).toFile(out);
    const m = await sharp(out).metadata();
    console.log(`gear ${name.padEnd(12)} ${m.width}x${m.height}`);
  }
}

async function normalizeBikes(dir) {
  // white-on-transparent -> trimmed, padded, transparent PNG (sits on dark chips)
  const files = readdirSync(dir).filter((f) => /\.png$/i.test(f));
  for (const f of files) {
    const { name } = parse(f);
    const src = join(dir, f);
    const buf = await sharp(src)
      .trim({ threshold: 10 })
      .resize({ height: H, fit: "inside" })
      .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await sharp(buf).toFile(src);
    const m = await sharp(src).metadata();
    console.log(`bike ${name.padEnd(12)} ${m.width}x${m.height}`);
  }
}

await normalizeGear("public/brands/gear");
await normalizeBikes("public/brands/bikes");
console.log("done");
