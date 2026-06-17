import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// #113 (P6): the search + ⌘K palette query helpers each run uncached Supabase
// queries on interactive hot paths. They must carry a short-lived cache.
// Source-assertion seam (cache directives are compiler-level, no-ops under
// vitest) — matches the project's *.css.test.ts convention.
const productsSrc = readFileSync(
  new URL("./products.ts", import.meta.url),
  "utf8",
);
const categoriesSrc = readFileSync(
  new URL("./categories.ts", import.meta.url),
  "utf8",
);

describe("search query helpers are cached", () => {
  it("caches searchProducts with the products tag and a minutes lifetime", () => {
    expect(productsSrc).toMatch(
      /async function searchProducts\([\s\S]*?\{\s*"use cache";\s*cacheTag\("products"\);\s*cacheLife\("minutes"\);/,
    );
  });

  it("caches searchCategories with the categories tag and a minutes lifetime", () => {
    expect(categoriesSrc).toMatch(
      /async function searchCategories\([\s\S]*?\{\s*"use cache";\s*cacheTag\("categories"\);\s*cacheLife\("minutes"\);/,
    );
  });
});
