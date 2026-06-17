import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// #113 (P6): the search + ⌘K palette query helpers each run uncached Supabase
// queries on interactive hot paths. They must carry a short-lived cache.
// Source-assertion seam (cache directives are compiler-level, no-ops under
// vitest) — matches the project's *.css.test.ts convention. Assertions are
// scoped to each function body and order/whitespace-tolerant.
const productsSrc = readFileSync(
  new URL("./products.ts", import.meta.url),
  "utf8",
);
const categoriesSrc = readFileSync(
  new URL("./categories.ts", import.meta.url),
  "utf8",
);

/** Slice a top-level `async function <name>` body up to the next export. */
function fnBody(src: string, name: string): string {
  const start = src.indexOf(`async function ${name}(`);
  if (start === -1) throw new Error(`${name} not found`);
  const next = src.indexOf("\nexport ", start + 1);
  return src.slice(start, next === -1 ? undefined : next);
}

describe("search query helpers are cached", () => {
  it("caches searchProducts with the products tag and a minutes lifetime", () => {
    const body = fnBody(productsSrc, "searchProducts");
    expect(body).toContain('"use cache"');
    expect(body).toContain('cacheTag("products")');
    expect(body).toContain('cacheLife("minutes")');
  });

  it("caches searchCategories with the categories tag and a minutes lifetime", () => {
    const body = fnBody(categoriesSrc, "searchCategories");
    expect(body).toContain('"use cache"');
    expect(body).toContain('cacheTag("categories")');
    expect(body).toContain('cacheLife("minutes")');
  });
});
