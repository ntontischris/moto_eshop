/**
 * Free machine-translation runner for the product catalog — NO API key, NO cost.
 *
 * The catalog source text is English (names + descriptions). This translates
 * product DESCRIPTIONS from English into a target locale via Google's free
 * endpoint and upserts them into `product_translations`. Product NAMES are kept
 * as-is (English brand+model) per product decision. Resumable & idempotent:
 * already-translated (product_id, locale) rows are skipped.
 *
 * Usage:  node scripts/translate-catalog-free.mjs <locale> [maxProducts]
 *   e.g.  node scripts/translate-catalog-free.mjs el
 *         node scripts/translate-catalog-free.mjs bg 50
 */
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
};
const SUPABASE_URL = get("NEXT_PUBLIC_SUPABASE_URL");
const KEY = get("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

const LOCALE = process.argv[2];
const MAX = process.argv[3] ? parseInt(process.argv[3], 10) : Infinity;
const VALID = ["el", "bg", "sr", "ro", "sq"];
if (!VALID.includes(LOCALE)) {
  console.error("locale must be one of:", VALID.join(", "));
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Google's free (unofficial) translate endpoint — no key. POST form avoids URL length limits.
async function translate(text, tl) {
  const body = new URLSearchParams({ client: "gtx", sl: "en", tl, dt: "t", q: text });
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const r = await fetch("https://translate.googleapis.com/translate_a/single", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (r.status === 429 || r.status >= 500) {
        await sleep(3000 * (attempt + 1) + Math.random() * 2000);
        continue;
      }
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      return (data[0] || []).map((seg) => seg[0]).join("");
    } catch (e) {
      await sleep(2000 * (attempt + 1));
    }
  }
  throw new Error("translate failed after retries");
}

async function getDoneIds() {
  const done = new Set();
  let from = 0;
  const page = 1000;
  for (;;) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/product_translations?select=product_id&locale=eq.${LOCALE}`,
      { headers: { ...H, Range: `${from}-${from + page - 1}` } },
    );
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    rows.forEach((x) => done.add(x.product_id));
    if (rows.length < page) break;
    from += page;
  }
  return done;
}

async function* products() {
  let from = 0;
  const page = 500;
  for (;;) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,name,description&status=eq.active&order=id`,
      { headers: { ...H, Range: `${from}-${from + page - 1}` } },
    );
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const p of rows) yield p;
    if (rows.length < page) break;
    from += page;
  }
}

async function upsert(row) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/product_translations?on_conflict=product_id,locale`,
    {
      method: "POST",
      headers: { ...H, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row),
    },
  );
  if (!r.ok) {
    const t = await r.text();
    throw new Error("upsert " + r.status + " " + t.slice(0, 200));
  }
}

const done = await getDoneIds();
console.log(`[${LOCALE}] already translated: ${done.size}`);
let did = 0,
  failed = 0,
  skippedEmpty = 0;
for await (const p of products()) {
  if (done.has(p.id)) continue;
  if (did >= MAX) break;
  const desc = (p.description || "").trim();
  if (!desc) {
    skippedEmpty++;
    continue; // nothing to translate; read path falls back to source
  }
  // Ride out IP rate-limits: retry the SAME product with escalating cooldown
  // (30s, 60s … capped 5min) instead of skipping, so a long unattended run
  // waits out blocks and actually completes.
  let translated = null;
  for (let round = 0; round < 14; round++) {
    try {
      translated = await translate(desc, LOCALE);
      break;
    } catch (e) {
      const wait = Math.min(30000 * (round + 1), 300000);
      console.warn(
        `[${LOCALE}] blocked on ${p.id} — cooldown ${wait / 1000}s (round ${round + 1})`,
      );
      await sleep(wait);
    }
  }
  if (translated === null) {
    failed++;
    console.warn(`[${LOCALE}] gave up on ${p.id} after cooldowns`);
    continue;
  }
  await upsert({
    product_id: p.id,
    locale: LOCALE,
    name: p.name,
    description: translated || p.description,
    status: "active",
  });
  did++;
  await sleep(600 + Math.random() * 500);
  if (did % 25 === 0)
    console.log(`[${LOCALE}] ${did} done, ${failed} failed (last: ${(p.name || "").slice(0, 40)})`);
}
console.log(`[${LOCALE}] run complete: +${did} translated, ${failed} failed, ${skippedEmpty} empty skipped`);
