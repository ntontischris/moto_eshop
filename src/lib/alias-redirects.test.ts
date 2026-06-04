import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveAliasTarget } from "./alias-redirects";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function mockFetchOnce(body: unknown, ok = true) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok,
    json: async () => body,
  } as Response);
}

describe("resolveAliasTarget", () => {
  it("resolves a category alias to its clean full_path", async () => {
    mockFetchOnce([{ full_path: "eksoplismos-anabath/mpotes" }]);
    expect(
      await resolveAliasTarget("category", "eksoplismos-anabath--mpotes"),
    ).toBe("/eksoplismos-anabath/mpotes");
  });

  it("resolves a product alias to /{category_full_path}/{slug}", async () => {
    mockFetchOnce([
      {
        slug: "spi000glo03",
        categories: { full_path: "eksoplismos-anabath/endysh/gantia" },
      },
    ]);
    expect(await resolveAliasTarget("product", "spi000glo03")).toBe(
      "/eksoplismos-anabath/endysh/gantia/spi000glo03",
    );
  });

  it("falls back to /{slug} when a product has no category path", async () => {
    mockFetchOnce([{ slug: "spi000glo03", categories: null }]);
    expect(await resolveAliasTarget("product", "spi000glo03")).toBe(
      "/spi000glo03",
    );
  });

  it("returns null when the slug is not found", async () => {
    mockFetchOnce([]);
    expect(await resolveAliasTarget("category", "nope")).toBeNull();
  });

  it("returns null on a non-ok response (so caller falls through)", async () => {
    mockFetchOnce(null, false);
    expect(await resolveAliasTarget("product", "x")).toBeNull();
  });

  it("returns null on a network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));
    expect(await resolveAliasTarget("product", "x")).toBeNull();
  });

  it("returns null when env is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(await resolveAliasTarget("category", "x")).toBeNull();
  });
});
