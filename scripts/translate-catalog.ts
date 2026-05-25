/**
 * AI catalog translation runner.
 *
 * Pages through active products, detects which need (re)translation for a target
 * locale, masks glossary terms, translates name + description via Claude, and
 * upserts active `product_translations` rows. Resumable: rerun picks up anything
 * still missing (per-chunk failures are logged and skipped).
 *
 * Usage:
 *   pnpm i18n:translate --locale=en --sample=20
 *   pnpm i18n:translate --locale=en --field=name --force --concurrency=2
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { locales, defaultLocale, type Locale } from "../src/i18n/config";
import {
  chunk,
  needsTranslation,
  sourceHash,
  type SourceFields,
} from "../src/lib/i18n/catalog-translation";
import { protectGlossary, restoreGlossary } from "../src/lib/i18n/glossary";
import { createClaudeEngine } from "../src/lib/i18n/translate-engine";

// ── env ───────────────────────────────────────────────────────────────────

/** Load `.env` into process.env (the repo doesn't auto-load it). */
function loadEnv(): void {
  if (typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(".env");
      return;
    } catch {
      // fall through to manual parse
    }
  }
  try {
    const raw = readFileSync(".env", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // no .env file — rely on real process env
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

// ── CLI flags ───────────────────────────────────────────────────────────────

type Field = "all" | "name" | "description";

interface Flags {
  locale: Locale;
  sample?: number;
  limit?: number;
  field: Field;
  force: boolean;
  concurrency: number;
}

function parseFlags(argv: string[]): Flags {
  const get = (name: string): string | undefined => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit?.slice(name.length + 3);
  };
  const has = (name: string): boolean => argv.includes(`--${name}`);
  const num = (name: string): number | undefined => {
    const v = get(name);
    if (v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) {
      console.error(`--${name} must be a positive number`);
      process.exit(1);
    }
    return Math.floor(n);
  };

  const locale = get("locale");
  if (!locale) {
    console.error("Missing required flag: --locale=<code>");
    process.exit(1);
  }
  if (!locales.includes(locale as Locale) || locale === defaultLocale) {
    console.error(
      `--locale must be a non-default locale. Got "${locale}". ` +
        `Allowed: ${locales.filter((l) => l !== defaultLocale).join(", ")}`,
    );
    process.exit(1);
  }

  const field = (get("field") ?? "all") as Field;
  if (!["all", "name", "description"].includes(field)) {
    console.error(
      `--field must be one of all|name|description. Got "${field}"`,
    );
    process.exit(1);
  }

  return {
    locale: locale as Locale,
    sample: num("sample"),
    limit: num("limit"),
    field,
    force: has("force"),
    concurrency: num("concurrency") ?? 1,
  };
}

// ── data types ───────────────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
}

interface ExistingRow {
  product_id: string;
  source_hash: string | null;
}

const CHUNK_SIZE = 20;
const PAGE_SIZE = 1000;
const ENGINE_TAG = "claude-haiku+sonnet";

// ── data access ──────────────────────────────────────────────────────────────

type Supa = ReturnType<typeof createClient<Database>>;

async function loadBrandNames(supabase: Supa): Promise<string[]> {
  const { data, error } = await supabase.from("brands").select("name");
  if (error) throw error;
  return (data ?? [])
    .map((r) => (r as { name: string | null }).name)
    .filter((n): n is string => typeof n === "string" && n.trim().length > 0);
}

async function loadActiveProducts(
  supabase: Supa,
  cap?: number,
): Promise<ProductRow[]> {
  const out: ProductRow[] = [];
  let from = 0;
  for (;;) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("products")
      .select("id,name,description")
      .eq("status", "active")
      .order("id", { ascending: true })
      .range(from, to);
    if (error) throw error;
    const page = (data ?? []) as ProductRow[];
    out.push(...page);
    if (page.length < PAGE_SIZE) break;
    if (cap !== undefined && out.length >= cap) break;
    from += PAGE_SIZE;
  }
  return cap !== undefined ? out.slice(0, cap) : out;
}

async function loadExistingHashes(
  supabase: Supa,
  locale: string,
): Promise<Map<string, ExistingRow>> {
  const map = new Map<string, ExistingRow>();
  let from = 0;
  for (;;) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("product_translations")
      .select("product_id,source_hash")
      .eq("locale", locale)
      .range(from, to);
    if (error) throw error;
    const page = (data ?? []) as ExistingRow[];
    for (const row of page) map.set(row.product_id, row);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return map;
}

// ── translation ──────────────────────────────────────────────────────────────

/** Translate a list of source strings, masking/restoring glossary per item. */
async function translateField(
  engine: ReturnType<typeof createClaudeEngine>,
  rawTexts: string[],
  brands: string[],
  targetLocale: string,
  kind: "name" | "description",
): Promise<string[]> {
  const maps = rawTexts.map((t) => protectGlossary(t, brands));
  const translated = await engine.translate({
    texts: maps.map((m) => m.masked),
    targetLocale,
    kind,
  });
  return translated.map((t, i) => restoreGlossary(t, maps[i].map));
}

async function processChunk(
  supabase: Supa,
  engine: ReturnType<typeof createClaudeEngine>,
  products: ProductRow[],
  brands: string[],
  flags: Flags,
): Promise<void> {
  const doName = flags.field === "all" || flags.field === "name";
  const doDesc = flags.field === "all" || flags.field === "description";

  const names = doName
    ? await translateField(
        engine,
        products.map((p) => p.name ?? ""),
        brands,
        flags.locale,
        "name",
      )
    : null;

  // Only translate non-empty descriptions; map results back by index.
  const descIndexes = doDesc
    ? products.flatMap((p, i) => (p.description?.trim() ? [i] : []))
    : [];
  const descResults = descIndexes.length
    ? await translateField(
        engine,
        descIndexes.map((i) => products[i].description ?? ""),
        brands,
        flags.locale,
        "description",
      )
    : [];
  const descByIndex = new Map<number, string>();
  descIndexes.forEach((idx, j) => descByIndex.set(idx, descResults[j]));

  const now = new Date().toISOString();
  const rows = products.map((p, i) => {
    const src: SourceFields = { name: p.name, description: p.description };
    const translatedName = names?.[i]?.trim();
    return {
      product_id: p.id,
      locale: flags.locale,
      name:
        translatedName && translatedName.length > 0 ? translatedName : p.name,
      description: descByIndex.get(i) ?? null,
      status: "active" as const,
      source_hash: sourceHash(src),
      engine: ENGINE_TAG,
      translated_at: now,
    };
  });

  const { error } = await supabase
    .from("product_translations")
    .upsert(rows, { onConflict: "product_id,locale" });
  if (error) throw error;
}

/** Run async workers over chunks with bounded concurrency. */
async function runWithConcurrency(
  chunks: ProductRow[][],
  concurrency: number,
  worker: (chunk: ProductRow[], chunkIndex: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  const lanes = Array.from(
    { length: Math.min(concurrency, chunks.length) },
    async () => {
      for (;;) {
        const i = next++;
        if (i >= chunks.length) return;
        await worker(chunks[i], i);
      }
    },
  );
  await Promise.all(lanes);
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnv();
  const flags = parseFlags(process.argv.slice(2));

  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient<Database>(supabaseUrl, serviceKey);
  const engine = createClaudeEngine(apiKey);

  console.log(`[${flags.locale}] loading brands…`);
  const brands = await loadBrandNames(supabase);

  const cap = flags.sample ?? flags.limit;
  console.log(
    `[${flags.locale}] loading active products${cap ? ` (cap ${cap})` : ""}…`,
  );
  const products = await loadActiveProducts(supabase, cap);

  console.log(`[${flags.locale}] loading existing translations…`);
  const existing = await loadExistingHashes(supabase, flags.locale);

  const todo = flags.force
    ? products
    : products.filter((p) =>
        needsTranslation(
          { name: p.name, description: p.description },
          existing.get(p.id),
        ),
      );

  console.log(
    `[${flags.locale}] ${todo.length}/${products.length} products need work ` +
      `(field=${flags.field}, concurrency=${flags.concurrency}, force=${flags.force})`,
  );
  if (todo.length === 0) {
    console.log(`[${flags.locale}] nothing to do.`);
    return;
  }

  const chunks = chunk(todo, CHUNK_SIZE);
  let done = 0;
  let failed = 0;

  await runWithConcurrency(chunks, flags.concurrency, async (chunkRows) => {
    try {
      await processChunk(supabase, engine, chunkRows, brands, flags);
      done += chunkRows.length;
      console.log(`[${flags.locale}] ${done}/${todo.length}`);
    } catch (err) {
      failed += chunkRows.length;
      console.error(
        `[${flags.locale}] chunk failed (${chunkRows.length} products), skipping:`,
        err instanceof Error ? err.message : err,
      );
    }
  });

  console.log(
    `[${flags.locale}] complete — translated ${done}, failed ${failed}. ` +
      (failed ? "Rerun to retry the failures." : ""),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
