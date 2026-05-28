import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addToCartTool,
  addToCartInputSchema,
  type AddToCartResult,
} from "./add-to-cart";

const mockedAction = vi.fn();
vi.mock("@/lib/actions/cart", () => ({
  addToCart: (...args: unknown[]) => mockedAction(...args),
}));

describe("addToCartTool", () => {
  beforeEach(() => mockedAction.mockReset());

  it("requires productId and unitPrice; qty defaults to 1 inside execute", () => {
    expect(addToCartInputSchema.safeParse({}).success).toBe(false);
    expect(addToCartInputSchema.safeParse({ productId: "p1" }).success).toBe(
      false,
    ); // unitPrice required
    expect(
      addToCartInputSchema.safeParse({ productId: "p1", unitPrice: 29.99 })
        .success,
    ).toBe(true);
  });

  it("calls the existing cart action and returns success summary", async () => {
    // Real action returns { success: true; data: { cartId, itemCount } }
    mockedAction.mockResolvedValueOnce({
      success: true,
      data: { cartId: "cart-1", itemCount: 3 },
    });
    const out = (await addToCartTool.execute!(
      { productId: "p1", unitPrice: 29.99, qty: 2 },
      { toolCallId: "x", messages: [] } as never,
    )) as AddToCartResult;
    expect(out.success).toBe(true);
    expect(out.cartItemCount).toBe(3);
    expect(mockedAction).toHaveBeenCalled();
  });

  it("returns success=false on action error", async () => {
    // Real action returns { success: false; error: string }
    mockedAction.mockResolvedValueOnce({
      success: false,
      error: "out of stock",
    });
    const out = (await addToCartTool.execute!(
      { productId: "p1", unitPrice: 29.99 },
      { toolCallId: "x", messages: [] } as never,
    )) as AddToCartResult;
    expect(out.success).toBe(false);
    expect(out.error).toContain("out of stock");
  });

  it("returns success=false when action throws", async () => {
    mockedAction.mockRejectedValueOnce(new Error("network failure"));
    const out = (await addToCartTool.execute!(
      { productId: "p1", unitPrice: 29.99 },
      { toolCallId: "x", messages: [] } as never,
    )) as AddToCartResult;
    expect(out.success).toBe(false);
    expect(out.error).toContain("network failure");
  });
});
