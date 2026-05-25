import { describe, it, expect } from "vitest";
import { extractJson, repairVariants } from "./repair";

describe("extractJson", () => {
  it("parses a fenced json block", () => {
    const text = 'Here you go:\n```json\n{"a":1}\n```\nThanks!';
    expect(extractJson(text)).toEqual({ a: 1 });
  });

  it("parses bare json", () => {
    expect(extractJson('{"a":2}')).toEqual({ a: 2 });
  });

  it("returns null for non-json", () => {
    expect(extractJson("no json here")).toBeNull();
  });
});

describe("repairVariants", () => {
  it("keeps valid blocks and drops invalid ones", () => {
    const text = JSON.stringify({
      variants: [
        {
          name: "A",
          seoTitle: "T",
          blocks: [
            { type: "discountBanner", code: "BF20", text: "Save" },
            { type: "hero", headline: "" }, // invalid: empty headline + missing fields
            { type: "richText", html: "<p>hi</p>" },
          ],
        },
      ],
    });
    const variants = repairVariants(text);
    expect(variants).toHaveLength(1);
    expect(variants[0].name).toBe("A");
    expect(variants[0].blocks).toHaveLength(2); // banner + richText
  });

  it("skips variants with no valid blocks", () => {
    const text = JSON.stringify({
      variants: [{ name: "Empty", blocks: [{ type: "nonsense" }] }],
    });
    expect(repairVariants(text)).toHaveLength(0);
  });

  it("defaults a missing variant name", () => {
    const text = JSON.stringify({
      variants: [{ blocks: [{ type: "richText", html: "x" }] }],
    });
    expect(repairVariants(text)[0].name).toBe("Variant 1");
  });

  it("caps the number of variants", () => {
    const one = { blocks: [{ type: "richText", html: "x" }] };
    const text = JSON.stringify({ variants: [one, one, one, one, one, one] });
    expect(repairVariants(text, 4)).toHaveLength(4);
  });

  it("returns [] for non-json input", () => {
    expect(repairVariants("the model refused")).toHaveLength(0);
  });
});
