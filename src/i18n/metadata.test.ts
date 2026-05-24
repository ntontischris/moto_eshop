import { describe, it, expect } from "vitest";
import { buildAlternates } from "./metadata";

describe("buildAlternates", () => {
  it("emits canonical for the locale and hreflang for all + x-default", () => {
    const a = buildAlternates("en", "/category/helmets");
    expect(a.canonical).toBe("/en/category/helmets");
    expect(a.languages["el"]).toBe("/category/helmets");
    expect(a.languages["en"]).toBe("/en/category/helmets");
    expect(a.languages["bg"]).toBe("/bg/category/helmets");
    expect(a.languages["x-default"]).toBe("/category/helmets");
  });

  it("keeps Greek (default) unprefixed as canonical", () => {
    const a = buildAlternates("el", "/product/abc");
    expect(a.canonical).toBe("/product/abc");
  });
});
