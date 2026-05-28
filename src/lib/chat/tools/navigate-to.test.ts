import { describe, it, expect } from "vitest";
import { navigateToInputSchema, isRouteAllowed } from "./navigate-to";

describe("navigateToInputSchema", () => {
  it("requires route", () => {
    expect(navigateToInputSchema.safeParse({}).success).toBe(false);
  });
  it("accepts a normal route", () => {
    expect(
      navigateToInputSchema.safeParse({ route: "/category/kranh" }).success,
    ).toBe(true);
  });
  it("rejects empty route", () => {
    expect(navigateToInputSchema.safeParse({ route: "" }).success).toBe(false);
  });
});

describe("isRouteAllowed", () => {
  it("allows category and product routes", () => {
    expect(isRouteAllowed("/category/kranh")).toBe(true);
    expect(isRouteAllowed("/product/shoei-rf")).toBe(true);
    expect(isRouteAllowed("/")).toBe(true);
  });
  it("rejects admin routes", () => {
    expect(isRouteAllowed("/admin")).toBe(false);
    expect(isRouteAllowed("/admin/campaigns")).toBe(false);
  });
  it("rejects checkout sub-routes but allows cart and checkout entry", () => {
    expect(isRouteAllowed("/checkout/payment")).toBe(false);
    expect(isRouteAllowed("/checkout/success")).toBe(false);
    expect(isRouteAllowed("/cart")).toBe(true);
    expect(isRouteAllowed("/checkout")).toBe(true);
  });
  it("rejects absolute URLs and protocol-relative", () => {
    expect(isRouteAllowed("https://evil.com")).toBe(false);
    expect(isRouteAllowed("//evil.com")).toBe(false);
  });
});
