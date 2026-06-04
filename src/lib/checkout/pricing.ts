import {
  FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_ESTIMATE,
} from "@/lib/cart/utils";

export interface OrderLineInput {
  slug: string;
  qty: number;
}

export interface ProductPricing {
  id: string;
  slug: string;
  price: number;
  stock: number;
  status: string;
}

export interface PricedLine {
  productId: string;
  slug: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type PriceOrderResult =
  | {
      ok: true;
      lines: PricedLine[];
      subtotal: number;
      shipping: number;
      total: number;
    }
  | { ok: false; error: string };

/**
 * Re-prices an order from authoritative product rows. The input carries no
 * price, so a client-supplied amount can never be trusted; `unitPrice` always
 * comes from the matched product row. Unknown, inactive, or out-of-stock lines
 * are rejected before any total is produced. Pure: no I/O. See ADR 0001.
 */
export function priceOrder(
  items: OrderLineInput[],
  products: ProductPricing[],
): PriceOrderResult {
  if (items.length === 0) {
    return { ok: false, error: "Το καλάθι είναι άδειο." };
  }

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const lines: PricedLine[] = [];

  for (const item of items) {
    const product = bySlug.get(item.slug);
    if (!product || product.status !== "active") {
      return {
        ok: false,
        error: `Το προϊόν "${item.slug}" δεν είναι διαθέσιμο.`,
      };
    }
    if (!Number.isInteger(item.qty) || item.qty < 1) {
      return { ok: false, error: `Μη έγκυρη ποσότητα για "${item.slug}".` };
    }
    if (product.stock < item.qty) {
      return { ok: false, error: `Ανεπαρκές απόθεμα για "${item.slug}".` };
    }
    lines.push({
      productId: product.id,
      slug: product.slug,
      quantity: item.qty,
      unitPrice: product.price,
      lineTotal: product.price * item.qty,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_ESTIMATE;
  const total = subtotal + shipping;

  return { ok: true, lines, subtotal, shipping, total };
}
