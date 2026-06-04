import { describe, it, expect } from "vitest";
import { productPath, categoryPath } from "./urls";

describe("categoryPath", () => {
  it("builds a clean category path from full_path", () => {
    expect(categoryPath("eksoplismos-anabath/endysh/mpoyfan")).toBe(
      "/eksoplismos-anabath/endysh/mpoyfan",
    );
  });
  it("handles a root category (full_path === slug)", () => {
    expect(categoryPath("prosfores")).toBe("/prosfores");
  });
  it("strips a leading slash if one is passed in", () => {
    expect(categoryPath("/endysh")).toBe("/endysh");
  });
});

describe("productPath", () => {
  it("builds a clean product path under its category full_path", () => {
    expect(productPath("eksoplismos-anabath/endysh", "abudisloc30")).toBe(
      "/eksoplismos-anabath/endysh/abudisloc30",
    );
  });
  it("falls back to /{slug} when category path is null", () => {
    expect(productPath(null, "abudisloc30")).toBe("/abudisloc30");
  });
  it("falls back to /{slug} when category path is empty", () => {
    expect(productPath("", "abudisloc30")).toBe("/abudisloc30");
  });
});
