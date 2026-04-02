import type { CartItem } from "@/lib/queries/cart";

export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_RATES = {
  acs_standard: { label: "ACS Courier", price: 4.9 },
  acs_express: { label: "ACS Express", price: 7.9 },
  store_pickup: { label: "Παραλαβή από κατάστημα", price: 0 },
  elta: { label: "ΕΛΤΑ", price: 3.5 },
} as const;

export type ShippingMethodKey = keyof typeof SHIPPING_RATES;

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
}

export function calculateShipping(
  subtotal: number,
  method: ShippingMethodKey,
): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD && method !== "acs_express") return 0;
  return SHIPPING_RATES[method].price;
}

export function calculateTotal(subtotal: number, shipping: number): number {
  return subtotal + shipping;
}

export function calculateAmountToFreeShipping(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}

export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MM-${date}-${random}`;
}
