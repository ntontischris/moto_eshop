import { describe, it, expect, vi, beforeEach } from "vitest";

const getCategory = vi.fn();
vi.mock("@/lib/queries/categories", () => ({ getCategory }));

describe("categoryRedirectTarget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the clean canonical path for a category", async () => {
    getCategory.mockResolvedValueOnce({
      slug: "endysh",
      full_path: "eksoplismos-anabath/endysh",
    });
    const { categoryRedirectTarget } = await import("./redirect-target");
    expect(await categoryRedirectTarget("endysh", "el")).toBe(
      "/eksoplismos-anabath/endysh",
    );
  });

  it("returns null when the category does not exist", async () => {
    getCategory.mockResolvedValueOnce(null);
    const { categoryRedirectTarget } = await import("./redirect-target");
    expect(await categoryRedirectTarget("nope", "el")).toBeNull();
  });

  it("returns null when the category has no full_path", async () => {
    getCategory.mockResolvedValueOnce({ slug: "orphan", full_path: null });
    const { categoryRedirectTarget } = await import("./redirect-target");
    expect(await categoryRedirectTarget("orphan", "el")).toBeNull();
  });
});
