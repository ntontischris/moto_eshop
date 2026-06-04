import { describe, it, expect, vi, beforeEach } from "vitest";

const getProduct = vi.fn();
vi.mock("@/lib/queries/products", () => ({ getProduct }));

describe("productRedirectTarget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the clean canonical path for a product", async () => {
    getProduct.mockResolvedValueOnce({
      slug: "abudisloc30",
      category_path: "eksoplismos-anabath/endysh",
    });
    const { productRedirectTarget } = await import("./redirect-target");
    expect(await productRedirectTarget("abudisloc30", "el")).toBe(
      "/eksoplismos-anabath/endysh/abudisloc30",
    );
  });

  it("falls back to /{slug} when the product has no category path", async () => {
    getProduct.mockResolvedValueOnce({
      slug: "abudisloc30",
      category_path: null,
    });
    const { productRedirectTarget } = await import("./redirect-target");
    expect(await productRedirectTarget("abudisloc30", "el")).toBe(
      "/abudisloc30",
    );
  });

  it("returns null when the product does not exist", async () => {
    getProduct.mockResolvedValueOnce(null);
    const { productRedirectTarget } = await import("./redirect-target");
    expect(await productRedirectTarget("nope", "el")).toBeNull();
  });
});
