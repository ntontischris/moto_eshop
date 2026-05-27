"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import type { CompareProduct } from "@/lib/chat/tools/compare-products";
import styles from "./chat.module.css";

interface Props {
  products: CompareProduct[];
  fields: string[];
}

const LABELS: Record<string, string> = {
  price: "Τιμή",
  weight: "Βάρος",
  certifications: "Πιστοποιήσεις",
  in_stock: "Διαθεσιμότητα",
};

function renderCell(p: CompareProduct, field: string, locale: string): string {
  if (field === "price") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(p.price);
  }
  if (field === "weight") {
    return p.weight ? `${p.weight}g` : "—";
  }
  if (field === "certifications") {
    return p.certifications.length ? p.certifications.join(", ") : "—";
  }
  if (field === "in_stock") {
    return p.in_stock ? "✓" : "✗";
  }
  return "—";
}

export function ChatProductCompare({ products, fields }: Props) {
  const locale = useLocale();
  return (
    <div className={styles.compareWrap}>
      <table className={styles.compare}>
        <thead>
          <tr>
            <th></th>
            {products.map((p) => (
              <th key={p.id} scope="col">
                <Link
                  href={`/${locale}/product/${p.slug}`}
                  className={styles.compareName}
                  prefetch={false}
                >
                  {p.brand} {p.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f}>
              <th scope="row">{LABELS[f] ?? f}</th>
              {products.map((p) => (
                <td key={p.id + f}>{renderCell(p, f, locale)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
