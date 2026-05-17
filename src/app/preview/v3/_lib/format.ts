const EUR = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(value: number): string {
  return EUR.format(value);
}

export function hasDiscount(price: number, compareAt: number | null): boolean {
  return compareAt != null && compareAt > price;
}

export function discountPercent(
  price: number,
  compareAt: number | null,
): number {
  if (!hasDiscount(price, compareAt)) return 0;
  return Math.round(((compareAt! - price) / compareAt!) * 100);
}
