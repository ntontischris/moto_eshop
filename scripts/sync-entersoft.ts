/**
 * Initial sync from Entersoft snapshot JSON files into Supabase.
 *
 * Run:
 *   pnpm tsx scripts/sync-entersoft.ts <command>
 *
 * Commands:
 *   brands      — upsert all distinct brands from items.json
 *   products    — upsert all products (name placeholder = SKU until content arrives)
 *   prices      — overlay newest price per ItemGID onto products
 *   stock       — populate product_stock_locations per warehouse / size
 *   customers   — import legacy customers into erp_customers mirror
 *   sites       — import legacy customer sites into erp_customer_sites mirror
 *   all         — run brands → products → prices → stock → customers → sites
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { config } from "dotenv";
// Try .env.local first (Next.js convention), fall back to .env
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  mapCustomer,
  mapCustomerSite,
  mapItem,
  mapPrice,
  mapStock,
} from "../src/lib/erp/adapters/entersoft/mappers";
import type {
  RawCustomer,
  RawCustomerSite,
  RawItem,
  RawPrice,
  RawStock,
} from "../src/lib/erp/adapters/entersoft/raw-types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SNAPSHOT_DIR = join(process.cwd(), "data", "entersoft-snapshot");

function loadSnapshot<T>(file: string): T[] {
  const path = join(SNAPSHOT_DIR, file);
  if (!existsSync(path)) {
    throw new Error(
      `Snapshot file missing: ${path}\nRun scripts/pull-entersoft-data.ps1 first.`,
    );
  }
  let raw = readFileSync(path, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const payload = JSON.parse(raw);
  return (payload.rows ?? payload.Rows ?? []) as T[];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function logRun<T>(
  entity: string,
  fn: () => Promise<{ in: number; out: number }>,
): Promise<void> {
  const { data: logRow } = await supabase
    .from("erp_sync_log")
    .insert({
      entity,
      source: "entersoft",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  const logId = logRow?.id;
  try {
    const result = await fn();
    if (logId) {
      await supabase
        .from("erp_sync_log")
        .update({
          status: "success",
          records_in: result.in,
          records_out: result.out,
          ended_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }
    console.log(`✓ ${entity}: ${result.out} / ${result.in}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (logId) {
      await supabase
        .from("erp_sync_log")
        .update({
          status: "failed",
          error: msg,
          ended_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }
    console.error(`✗ ${entity}:`, msg);
    throw e;
  }
}

// ---------- BRANDS ----------
async function syncBrands(): Promise<void> {
  await logRun("brand", async () => {
    const raw = loadSnapshot<RawItem>("items.json");
    const brands = new Map<string, { name: string; slug: string }>();
    for (const r of raw) {
      const b = r.Brand?.trim();
      if (!b) continue;
      const slug = slugify(b);
      if (!slug) continue;
      if (!brands.has(slug)) brands.set(slug, { name: b, slug });
    }
    const rows = Array.from(brands.values());
    const { error } = await supabase
      .from("brands")
      .upsert(rows, { onConflict: "slug" });
    if (error) throw error;
    return { in: raw.length, out: rows.length };
  });
}

// ---------- PRODUCTS ----------
async function syncProducts(): Promise<void> {
  await logRun("product", async () => {
    // Clean slate: wipe any partial inserts from a previous failed run.
    // After the first successful initial sync, this becomes a no-op fast path.
    {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      if ((count ?? 0) > 0) {
        console.log(`  wiping existing ${count} products before re-sync...`);
        // Use a sentinel id filter that matches all rows
        const { error: delErr } = await supabase
          .from("products")
          .delete()
          .gte("created_at", "1970-01-01");
        if (delErr) throw delErr;
      }
    }

    const raw = loadSnapshot<RawItem>("items.json");
    // brand slug -> id
    const { data: brandsRows } = await supabase
      .from("brands")
      .select("id, slug");
    const brandIdBySlug = new Map<string, string>(
      (brandsRows ?? []).map((b: { id: string; slug: string }) => [
        b.slug,
        b.id,
      ]),
    );

    // Dedupe by SKU. ERP has phantom records (leading space, MissingFields=1,
    // no brand) sharing real SKUs after trim. Prefer the "richest" row per SKU.
    function rowScore(r: RawItem): number {
      let s = 0;
      if (r.MissingFields === 0) s += 100;
      if (r.Inactive === 0) s += 50;
      if (r.WEB === 1) s += 25;
      if (r.Brand) s += 10;
      if (r.RetailPrice > 0) s += 5;
      if (r.ItemFamily) s += 2;
      return s;
    }
    const bySku = new Map<string, RawItem>();
    let skippedEmpty = 0;
    for (const r of raw) {
      const sku = r.Code?.trim();
      if (!sku) {
        skippedEmpty++;
        continue;
      }
      const existing = bySku.get(sku);
      if (!existing || rowScore(r) > rowScore(existing)) bySku.set(sku, r);
    }
    if (skippedEmpty) {
      console.log(`  skipped ${skippedEmpty} rows with empty SKU`);
    }
    const deduped = Array.from(bySku.values());
    if (deduped.length < raw.length) {
      console.log(
        `  deduped ${raw.length} → ${deduped.length} (${raw.length - deduped.length} dupes)`,
      );
    }

    let inserted = 0;
    const slugCounts = new Map<string, number>();

    for (const batch of chunk(deduped, 200)) {
      const rows = batch
        .map((r) => mapItem(r))
        .map((p) => {
          // Slug uniqueness: prefer SKU, fall back to suffix counter
          const base = slugify(p.sku) || `item-${p.erpId.slice(0, 8)}`;
          const seen = slugCounts.get(base) ?? 0;
          const slug = seen === 0 ? base : `${base}-${seen + 1}`;
          slugCounts.set(base, seen + 1);

          const brandId = p.brand
            ? (brandIdBySlug.get(slugify(p.brand)) ?? null)
            : null;

          return {
            erp_id: p.erpId,
            sku: p.sku,
            slug,
            name: p.sku, // placeholder until eshop scraper provides real name
            brand_id: brandId,
            price: p.retailPrice,
            wholesale_price: p.wholesalePrice,
            stock: 0, // will be filled by syncStock; granular truth in product_stock_locations
            barcodes: p.barcodes,
            category_codes: p.categoryPath,
            erp_has_missing_fields: p.hasMissingFields,
            status: p.publishable ? "active" : "draft",
            sizes: p.stockDimensions,
            last_synced_at: new Date().toISOString(),
          };
        });

      const { error, count } = await supabase
        .from("products")
        .upsert(rows, { onConflict: "erp_id", count: "exact" });
      if (error) throw error;
      inserted += count ?? rows.length;
    }

    return { in: raw.length, out: inserted };
  });
}

// ---------- PRICES (newest per ItemGID overlays product.price) ----------
async function syncPrices(): Promise<void> {
  await logRun("price", async () => {
    const raw = loadSnapshot<RawPrice>("prices.json");
    // Keep only the newest record per ItemGID
    const newest = new Map<string, ReturnType<typeof mapPrice>>();
    for (const r of raw) {
      const m = mapPrice(r);
      const prev = newest.get(m.erpItemId);
      if (!prev) newest.set(m.erpItemId, m);
      else {
        const a = prev.lastModified ?? "";
        const b = m.lastModified ?? "";
        if (b > a) newest.set(m.erpItemId, m);
      }
    }
    // Parallel-batched UPDATEs. supabase-js doesn't support a single bulk
    // UPDATE for different values per row, but we can fan out per batch.
    const all = Array.from(newest.values());
    const CONCURRENCY = 25;
    let updated = 0;
    let done = 0;
    const total = all.length;

    for (const batch of chunk(all, CONCURRENCY)) {
      const results = await Promise.all(
        batch.map((p) =>
          supabase
            .from("products")
            .update(
              { price: p.retail, wholesale_price: p.price1 },
              { count: "exact" },
            )
            .eq("erp_id", p.erpItemId),
        ),
      );
      for (const r of results) {
        if (!r.error && (r.count ?? 0) > 0) updated++;
      }
      done += batch.length;
      if (done % 1000 === 0 || done === total) {
        console.log(`    prices: ${done}/${total} (matched=${updated})`);
      }
    }
    return { in: raw.length, out: updated };
  });
}

// ---------- STOCK ----------
async function syncStock(): Promise<void> {
  await logRun("stock", async () => {
    const raw = loadSnapshot<RawStock>("stock.json");
    // SKU -> product_id
    const skus = Array.from(new Set(raw.map((r) => r.Code.trim())));
    const idBySku = new Map<string, string>();
    for (const batch of chunk(skus, 1000)) {
      const { data } = await supabase
        .from("products")
        .select("id, sku")
        .in("sku", batch);
      for (const p of data ?? []) idBySku.set(p.sku, p.id);
    }

    const psl: Array<{
      product_id: string;
      warehouse_code: string;
      size: string;
      available: number;
      last_synced_at: string;
    }> = [];
    const now = new Date().toISOString();
    for (const r of raw) {
      const s = mapStock(r);
      const pid = idBySku.get(s.erpItemCode);
      if (!pid) continue;
      for (const [wh, qty] of Object.entries(s.byWarehouse)) {
        if (qty == null || qty === 0) continue;
        psl.push({
          product_id: pid,
          warehouse_code: wh,
          size: s.dimension ?? "",
          available: qty,
          last_synced_at: now,
        });
      }
    }

    let upserted = 0;
    for (const batch of chunk(psl, 500)) {
      // Replace per (product, warehouse, size)
      const { error, count } = await supabase
        .from("product_stock_locations")
        .upsert(batch, {
          onConflict: "product_id,warehouse_code,size",
          count: "exact",
        });
      if (error) throw error;
      upserted += count ?? batch.length;
    }

    // Denormalize total stock back to products.stock for fast filters,
    // PDP buy-box, availability badges and checkout pricing. Without this
    // rollup every product stays at the placeholder stock = 0 and the whole
    // catalog reads as out-of-stock — so a failure here must be loud, not
    // swallowed. (Provided by migration recompute_product_stock_totals.)
    const { error: rpcErr } = await supabase.rpc(
      "recompute_product_stock_totals",
    );
    if (rpcErr) {
      throw new Error(
        `recompute_product_stock_totals RPC failed (products.stock not denormalized — catalog would read as out-of-stock): ${rpcErr.message}`,
      );
    }

    return { in: raw.length, out: upserted };
  });
}

// ---------- CUSTOMERS ----------
async function syncCustomers(): Promise<void> {
  await logRun("customer", async () => {
    const raw = loadSnapshot<RawCustomer>("customers.json");
    let inserted = 0;
    for (const batch of chunk(raw, 200)) {
      const rows = batch
        .map((r) => mapCustomer(r))
        .map((c) => ({
          erp_id: c.erpId,
          erp_person_id: c.personId,
          code: c.code,
          name: c.name,
          vat: c.vat,
          email: c.email,
          phone: c.phone,
          salesman: c.salesman,
          inactive: c.inactive,
          balance_limit: c.balanceLimit,
          invoice_policy: c.invoicePolicy,
          last_modified_erp: c.lastModified,
        }));
      const { error, count } = await supabase
        .from("erp_customers")
        .upsert(rows, { onConflict: "erp_id", count: "exact" });
      if (error) throw error;
      inserted += count ?? rows.length;
    }
    return { in: raw.length, out: inserted };
  });
}

// ---------- CUSTOMER SITES ----------
async function syncSites(): Promise<void> {
  await logRun("customer_site", async () => {
    const raw = loadSnapshot<RawCustomerSite>("customer-sites.json");
    // Dedupe by GID (some rows recur across the snapshot)
    const byGid = new Map<string, RawCustomerSite>();
    for (const r of raw) {
      if (!r.GID) continue;
      // Keep the most recently-modified record per GID
      const prev = byGid.get(r.GID);
      if (!prev || (r.LastModifiedDate ?? "") > (prev.LastModifiedDate ?? ""))
        byGid.set(r.GID, r);
    }
    const deduped = Array.from(byGid.values());
    if (deduped.length < raw.length) {
      console.log(
        `  deduped ${raw.length} → ${deduped.length} (${raw.length - deduped.length} dupes)`,
      );
    }

    let inserted = 0;
    for (const batch of chunk(deduped, 200)) {
      const rows = batch
        .map((r) => mapCustomerSite(r))
        .map((s) => ({
          erp_id: s.erpId,
          customer_erp_id: s.customerErpId,
          customer_code: s.customerCode,
          customer_name: s.customerName,
          address: s.address,
          country_code: s.countryCode,
          district_code: s.districtCode,
          city_code: s.cityCode,
          area: s.area,
          postal_code: s.postalCode,
          phone: s.phone,
          vat: s.vat,
          is_main: s.isMainAddress,
          active: s.active,
          last_modified_erp: s.lastModified,
        }));
      const { error, count } = await supabase
        .from("erp_customer_sites")
        .upsert(rows, { onConflict: "erp_id", count: "exact" });
      if (error) throw error;
      inserted += count ?? rows.length;
    }
    return { in: raw.length, out: inserted };
  });
}

// ---------- MAIN ----------
async function main(): Promise<void> {
  const cmd = process.argv[2] ?? "all";
  const t0 = Date.now();
  switch (cmd) {
    case "brands":
      await syncBrands();
      break;
    case "products":
      await syncProducts();
      break;
    case "prices":
      await syncPrices();
      break;
    case "stock":
      await syncStock();
      break;
    case "customers":
      await syncCustomers();
      break;
    case "sites":
      await syncSites();
      break;
    case "all":
      await syncBrands();
      await syncProducts();
      await syncPrices();
      await syncStock();
      await syncCustomers();
      await syncSites();
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      console.error(
        "Usage: pnpm tsx scripts/sync-entersoft.ts [brands|products|prices|stock|customers|sites|all]",
      );
      process.exit(1);
  }
  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
