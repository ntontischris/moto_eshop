import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// #115 (P7): getProductFilters tagged only with the generic "products" tag, so
// revalidating one product busts every category's filter cache. It must also
// carry a category-scoped tag. Source-assertion seam (matches *.css.test.ts).
const source = readFileSync(new URL("./products.ts", import.meta.url), "utf8");

describe("getProductFilters cache tag scope", () => {
  it("adds a category-scoped filter tag", () => {
    expect(source).toMatch(/cacheTag\(`filters:\$\{[^}]+\}`\)/);
  });
});
