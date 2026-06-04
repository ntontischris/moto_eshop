import { describe, it, expect } from "vitest";
import {
  priceOrder,
  type OrderLineInput,
  type ProductPricing,
} from "./pricing";

const helmet: ProductPricing = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "shoei-nxr2",
  price: 200,
  stock: 5,
  status: "active",
};

describe("priceOrder", () => {
  it("prices each line from the product row, ignoring any client value", () => {
    const r = priceOrder([{ slug: "shoei-nxr2", qty: 2 }], [helmet]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lines[0].unitPrice).toBe(200);
    expect(r.lines[0].lineTotal).toBe(400);
    expect(r.lines[0].productId).toBe(helmet.id);
    expect(r.subtotal).toBe(400);
    expect(r.shipping).toBe(0); // over free-shipping threshold
    expect(r.total).toBe(400);
  });

  it("ignores a client-supplied price (the price-tampering guarantee)", () => {
    // A tampered line tries to drop the price 200€ → 2€. The input type carries
    // no price, so it is structurally dropped; the total must stay 200.
    const tampered = { slug: "shoei-nxr2", qty: 1, price: 2 } as OrderLineInput;
    const r = priceOrder([tampered], [helmet]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lines[0].unitPrice).toBe(200);
    expect(r.total).toBe(200);
  });

  it("sums multiple lines into the subtotal and total", () => {
    const glove: ProductPricing = {
      id: "00000000-0000-0000-0000-000000000002",
      slug: "alpinestars-smx",
      price: 30,
      stock: 10,
      status: "active",
    };
    const r = priceOrder(
      [
        { slug: "shoei-nxr2", qty: 1 },
        { slug: "alpinestars-smx", qty: 2 },
      ],
      [helmet, glove],
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lines).toHaveLength(2);
    expect(r.subtotal).toBe(260); // 200 + 30*2
    expect(r.shipping).toBe(0);
    expect(r.total).toBe(260);
  });

  it("applies the flat shipping estimate under the free-shipping threshold", () => {
    const cheap: ProductPricing = { ...helmet, price: 10 };
    const r = priceOrder([{ slug: "shoei-nxr2", qty: 1 }], [cheap]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.subtotal).toBe(10);
    expect(r.shipping).toBe(3.5);
    expect(r.total).toBe(13.5);
  });

  it("gives free shipping exactly at the threshold", () => {
    const atThreshold: ProductPricing = { ...helmet, price: 50 };
    const r = priceOrder([{ slug: "shoei-nxr2", qty: 1 }], [atThreshold]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.subtotal).toBe(50);
    expect(r.shipping).toBe(0);
    expect(r.total).toBe(50);
  });

  it("rejects an empty cart", () => {
    const r = priceOrder([], [helmet]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBeTruthy();
  });

  it("rejects an unknown slug", () => {
    const r = priceOrder([{ slug: "ghost", qty: 1 }], [helmet]);
    expect(r.ok).toBe(false);
  });

  it("rejects an inactive (draft) product", () => {
    const r = priceOrder(
      [{ slug: "shoei-nxr2", qty: 1 }],
      [{ ...helmet, status: "draft" }],
    );
    expect(r.ok).toBe(false);
  });

  it("rejects a non-positive quantity", () => {
    const r = priceOrder([{ slug: "shoei-nxr2", qty: 0 }], [helmet]);
    expect(r.ok).toBe(false);
  });

  it("rejects a non-integer quantity", () => {
    const r = priceOrder([{ slug: "shoei-nxr2", qty: 1.5 }], [helmet]);
    expect(r.ok).toBe(false);
  });

  it("rejects quantity above available stock", () => {
    const r = priceOrder([{ slug: "shoei-nxr2", qty: 6 }], [helmet]);
    expect(r.ok).toBe(false);
  });
});
