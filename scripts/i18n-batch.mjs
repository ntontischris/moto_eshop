/**
 * Helper for agent-driven catalog translation (no external API, no key).
 * Subagents (= Claude) translate the descriptions themselves and write here.
 *
 *   node scripts/i18n-batch.mjs count
 *     → prints how many active products have a non-empty description.
 *
 *   node scripts/i18n-batch.mjs fetch <offset> <limit>
 *     → prints JSON array [{id,name,description}] for that slice
 *       (active, non-empty description, ordered by id).
 *
 *   node scripts/i18n-batch.mjs write <jsonPath>
 *     → reads a JSON array of
 *       [{ id, name, el, bg, sr, ro, sq }]
 *       and upserts one product_translations row per locale
 *       (name kept as-is = English, description = that locale's text,
 *        status='active'), conflict target (product_id, locale).
 */
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
};
const URL_ = get("NEXT_PUBLIC_SUPABASE_URL");
const KEY = get("SUPABASE_SERVICE_ROLE_KEY");
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
const LOCALES = ["el", "bg", "sr", "ro", "sq"];

const mode = process.argv[2];

if (mode === "count") {
  const r = await fetch(
    `${URL_}/rest/v1/products?select=id&status=eq.active&description=not.is.null&description=neq.`,
    { headers: { ...H, Prefer: "count=exact", Range: "0-0" } },
  );
  console.log(r.headers.get("content-range"));
} else if (mode === "fetch") {
  const offset = parseInt(process.argv[3], 10) || 0;
  const limit = parseInt(process.argv[4], 10) || 50;
  const r = await fetch(
    `${URL_}/rest/v1/products?select=id,name,description&status=eq.active&description=not.is.null&description=neq.&order=id&offset=${offset}&limit=${limit}`,
    { headers: H },
  );
  const rows = await r.json();
  console.log(JSON.stringify(rows));
} else if (mode === "write") {
  const path = process.argv[3];
  const items = JSON.parse(readFileSync(path, "utf8"));
  const rows = [];
  for (const it of items) {
    for (const loc of LOCALES) {
      const desc = it[loc];
      if (!desc) continue;
      rows.push({
        product_id: it.id,
        locale: loc,
        name: it.name,
        description: desc,
        status: "active",
      });
    }
  }
  // upsert in chunks of 200
  let written = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const r = await fetch(
      `${URL_}/rest/v1/product_translations?on_conflict=product_id,locale`,
      {
        method: "POST",
        headers: {
          ...H,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      },
    );
    if (!r.ok) {
      console.error("write failed", r.status, (await r.text()).slice(0, 300));
      process.exit(1);
    }
    written += chunk.length;
  }
  console.log(`wrote ${written} rows for ${items.length} products`);
} else {
  console.error("usage: count | fetch <offset> <limit> | write <jsonPath>");
  process.exit(1);
}
