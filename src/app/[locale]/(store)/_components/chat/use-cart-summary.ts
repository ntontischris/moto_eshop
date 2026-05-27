"use client";

import { useState, useEffect, useRef } from "react";
import type { CartSummary } from "@/app/api/cart/summary/route";

const CartSummaryDefault: CartSummary = {
  itemCount: 0,
  totalCents: 0,
  currency: "EUR",
};

export function useCartSummary(): CartSummary {
  const [summary, setSummary] = useState<CartSummary>(CartSummaryDefault);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch("/api/cart/summary")
      .then((res) => res.json() as Promise<CartSummary>)
      .then(setSummary)
      .catch(() => {
        // keep defaults on error — non-critical
      });
  }, []);

  return summary;
}
