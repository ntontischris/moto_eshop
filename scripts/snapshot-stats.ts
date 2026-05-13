/**
 * Print a summary of the data we pulled from Entersoft.
 * Pure local analysis — no Supabase, no API.
 *
 * Run: pnpm tsx scripts/snapshot-stats.ts
 */

import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import type {
  RawCustomer,
  RawCustomerSite,
  RawItem,
  RawPrice,
  RawStock,
} from "../src/lib/erp/adapters/entersoft/raw-types";

const DIR = join(process.cwd(), "data", "entersoft-snapshot");

function load<T>(
  file: string,
): { rows: T[]; total: number; pulledAt: string } | null {
  const p = join(DIR, file);
  if (!existsSync(p)) return null;
  let raw = readFileSync(p, "utf8");
  // PowerShell writes UTF-8 with BOM; JSON.parse chokes on it
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const j = JSON.parse(raw);
  return {
    rows: j.rows ?? [],
    total: j.count ?? j.rows?.length ?? 0,
    pulledAt: j.pulledAt ?? "?",
  };
}

function fmtSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function topN<K>(map: Map<K, number>, n = 10): Array<[K, number]> {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function bar(n: number, max: number, width = 30): string {
  const pct = max === 0 ? 0 : n / max;
  return "█".repeat(Math.round(pct * width)).padEnd(width, "·");
}

console.log(
  "\n┌─────────────────────────────────────────────────────────────────┐",
);
console.log(
  "│  Entersoft Snapshot — Summary                                   │",
);
console.log(
  "└─────────────────────────────────────────────────────────────────┘\n",
);

// ──────────────────────────────────────────────────────────
// ITEMS
// ──────────────────────────────────────────────────────────
const items = load<RawItem>("items.json");
if (items) {
  const f = statSync(join(DIR, "items.json"));
  console.log(`📦 ITEMS — ${items.rows.length} rows (${fmtSize(f.size)})`);
  console.log(`   pulled at ${items.pulledAt}`);

  const brands = new Map<string, number>();
  const families = new Map<string, number>();
  const groups = new Map<string, number>();
  let webOn = 0,
    inactive = 0,
    missing = 0,
    withDims = 0,
    withBarcode = 0;
  let priced = 0,
    free = 0;
  for (const r of items.rows) {
    if (r.Brand)
      brands.set(r.Brand.trim(), (brands.get(r.Brand.trim()) ?? 0) + 1);
    if (r.ItemFamily)
      families.set(r.ItemFamily, (families.get(r.ItemFamily) ?? 0) + 1);
    if (r.ItemGroup)
      groups.set(r.ItemGroup, (groups.get(r.ItemGroup) ?? 0) + 1);
    if (r.WEB === 1) webOn++;
    if (r.Inactive === 1) inactive++;
    if (r.MissingFields === 1) missing++;
    if (r.fStockDimCode_comma_separated) withDims++;
    if (r.MultipleCode) withBarcode++;
    if ((r.RetailPrice ?? 0) > 0) priced++;
    else free++;
  }

  console.log(`\n   Status:`);
  console.log(
    `     WEB=1 (publishable):     ${webOn.toString().padStart(6)}  ${bar(webOn, items.rows.length)}`,
  );
  console.log(
    `     Inactive:                ${inactive.toString().padStart(6)}  ${bar(inactive, items.rows.length)}`,
  );
  console.log(
    `     MissingFields=1:         ${missing.toString().padStart(6)}  ${bar(missing, items.rows.length)}`,
  );
  console.log(
    `     With sizes/dims:         ${withDims.toString().padStart(6)}  ${bar(withDims, items.rows.length)}`,
  );
  console.log(`     With barcode (MultipleCode): ${withBarcode}`);
  console.log(`     RetailPrice > 0:         ${priced}, = 0: ${free}`);

  console.log(`\n   Distinct brands: ${brands.size}`);
  console.log("   Top 15 brands by item count:");
  for (const [b, n] of topN(brands, 15)) {
    console.log(
      `     ${b.padEnd(28)} ${n.toString().padStart(5)}  ${bar(n, items.rows.length)}`,
    );
  }

  console.log(`\n   Distinct ItemFamily: ${families.size}`);
  console.log("   Top 10:");
  for (const [f, n] of topN(families, 10)) {
    console.log(`     ${f.padEnd(20)} ${n.toString().padStart(5)}`);
  }

  console.log(`\n   Distinct ItemGroup: ${groups.size}`);
  console.log("   Top 15:");
  for (const [g, n] of topN(groups, 15)) {
    console.log(`     ${g.padEnd(20)} ${n.toString().padStart(5)}`);
  }
}

// ──────────────────────────────────────────────────────────
// PRICES
// ──────────────────────────────────────────────────────────
const prices = load<RawPrice>("prices.json");
if (prices) {
  const f = statSync(join(DIR, "prices.json"));
  console.log(`\n💶 PRICES — ${prices.rows.length} rows (${fmtSize(f.size)})`);
  const distinctItems = new Set(prices.rows.map((r) => r.ItemGID)).size;
  const retails = prices.rows
    .map((r) => Number(r.RetailPrice ?? 0))
    .filter((n) => n > 0);
  const sum = retails.reduce((a, b) => a + b, 0);
  const min = Math.min(...retails);
  const max = Math.max(...retails);
  console.log(`   distinct items priced: ${distinctItems}`);
  console.log(`   price > 0 records:     ${retails.length}`);
  console.log(`   min:  €${min.toFixed(2)}`);
  console.log(`   max:  €${max.toFixed(2)}`);
  console.log(`   mean: €${(sum / retails.length).toFixed(2)}`);
  const buckets = [0, 10, 25, 50, 100, 200, 500, 1000, 5000];
  const dist = new Array(buckets.length).fill(0);
  for (const p of retails) {
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (p >= buckets[i]) {
        dist[i]++;
        break;
      }
    }
  }
  console.log(`   Distribution:`);
  for (let i = 0; i < buckets.length; i++) {
    const next = buckets[i + 1] ?? "∞";
    const label = `€${buckets[i]}–${next}`;
    console.log(
      `     ${label.padEnd(15)} ${dist[i].toString().padStart(6)}  ${bar(dist[i], retails.length)}`,
    );
  }
}

// ──────────────────────────────────────────────────────────
// STOCK
// ──────────────────────────────────────────────────────────
const stock = load<RawStock>("stock.json");
if (stock) {
  const f = statSync(join(DIR, "stock.json"));
  console.log(`\n📍 STOCK — ${stock.rows.length} rows (${fmtSize(f.size)})`);
  const skus = new Set(stock.rows.map((r) => r.Code.trim()));
  const dims = new Set(stock.rows.map((r) => r.fStockDimCode).filter(Boolean));
  let posSindos = 0,
    posBeniz = 0,
    posAntist = 0,
    posBeino = 0,
    anyStock = 0;
  for (const r of stock.rows) {
    if ((r.Sindos_diathesimo ?? 0) > 0) posSindos++;
    if ((r.Benizelou_diathesimo ?? 0) > 0) posBeniz++;
    if ((r.Antistaseos_diathesimo ?? 0) > 0) posAntist++;
    if ((r.AvailableBeinoglou ?? 0) > 0) posBeino++;
    if ((r.diathesimo ?? 0) > 0) anyStock++;
  }
  console.log(`   distinct SKUs:         ${skus.size}`);
  console.log(`   distinct stock dims:   ${dims.size}`);
  console.log(`   rows w/ any stock > 0: ${anyStock}`);
  console.log(`   per warehouse (rows > 0):`);
  console.log(
    `     Σίνδος (Factory):      ${posSindos.toString().padStart(5)}`,
  );
  console.log(`     Καλλιθέα Βενιζέλου:    ${posBeniz.toString().padStart(5)}`);
  console.log(
    `     Αντιστάσεως:           ${posAntist.toString().padStart(5)}`,
  );
  console.log(`     Beinoglou (3PL):       ${posBeino.toString().padStart(5)}`);
}

// ──────────────────────────────────────────────────────────
// CUSTOMERS
// ──────────────────────────────────────────────────────────
const customers = load<RawCustomer>("customers.json");
if (customers) {
  const f = statSync(join(DIR, "customers.json"));
  console.log(
    `\n👥 CUSTOMERS — ${customers.rows.length} rows (${fmtSize(f.size)})`,
  );
  let active = 0,
    inactive = 0,
    hasEmail = 0,
    hasPhone = 0,
    hasVat = 0;
  const salesmen = new Map<string, number>();
  for (const c of customers.rows) {
    if (c.Inactive === 1) inactive++;
    else active++;
    if (c.EMailAddress?.trim()) hasEmail++;
    if (c.Telephone?.trim()) hasPhone++;
    if (c.TaxRegistrationNumber?.trim()) hasVat++;
    if (c.SalesmanCode)
      salesmen.set(c.SalesmanCode, (salesmen.get(c.SalesmanCode) ?? 0) + 1);
  }
  console.log(`   active:   ${active}`);
  console.log(`   inactive: ${inactive}`);
  console.log(
    `   w/ email: ${hasEmail}  (${((hasEmail / customers.rows.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `   w/ phone: ${hasPhone}  (${((hasPhone / customers.rows.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `   w/ VAT:   ${hasVat}  (${((hasVat / customers.rows.length) * 100).toFixed(1)}%)`,
  );
  console.log(`\n   Top salesmen by customer count:`);
  for (const [s, n] of topN(salesmen, 10)) {
    console.log(`     ${s.padEnd(10)} ${n.toString().padStart(5)}`);
  }
}

// ──────────────────────────────────────────────────────────
// CUSTOMER SITES
// ──────────────────────────────────────────────────────────
const sites = load<RawCustomerSite>("customer-sites.json");
if (sites) {
  const f = statSync(join(DIR, "customer-sites.json"));
  console.log(
    `\n🏠 CUSTOMER SITES — ${sites.rows.length} rows (${fmtSize(f.size)})`,
  );
  const byCustomer = new Map<string, number>();
  const cities = new Map<string, number>();
  const countries = new Map<string, number>();
  let mainAddrs = 0;
  for (const s of sites.rows) {
    byCustomer.set(
      s.TradeAccountGID,
      (byCustomer.get(s.TradeAccountGID) ?? 0) + 1,
    );
    if (s.fCityCode)
      cities.set(s.fCityCode, (cities.get(s.fCityCode) ?? 0) + 1);
    if (s.fCountryCode)
      countries.set(s.fCountryCode, (countries.get(s.fCountryCode) ?? 0) + 1);
    if (s.MainAddress === 1) mainAddrs++;
  }
  const counts = Array.from(byCustomer.values());
  const avg =
    counts.length === 0 ? 0 : counts.reduce((a, b) => a + b, 0) / counts.length;
  console.log(`   distinct customers w/ sites: ${byCustomer.size}`);
  console.log(`   avg sites per customer:      ${avg.toFixed(2)}`);
  console.log(`   max sites for one customer:  ${Math.max(...counts)}`);
  console.log(`   marked as main address:      ${mainAddrs}`);

  console.log(`\n   Top 10 cities:`);
  for (const [c, n] of topN(cities, 10)) {
    console.log(`     ${c.padEnd(28)} ${n.toString().padStart(5)}`);
  }
  console.log(`\n   Top 10 countries:`);
  for (const [c, n] of topN(countries, 10)) {
    console.log(`     ${c.padEnd(28)} ${n.toString().padStart(5)}`);
  }
}

console.log("\n");
