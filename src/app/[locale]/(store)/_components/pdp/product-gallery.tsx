"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ProductImage } from "@/lib/queries/products";
import { SmartImage } from "../commerce/smart-image";

/* ProductGallery — main image + thumbnail strip. Keyboard accessible.
   No zoom lib, no parallax. */

export function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const t = useTranslations("pdp");
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const [active, setActive] = useState(0);
  const main = sorted[active] ?? sorted[0];

  if (!main) {
    return <div className="v3-gal v3-gal--empty" aria-hidden="true" />;
  }

  return (
    <div className="v3-gal">
      <div className="v3-gal-main">
        <SmartImage
          src={main.url}
          alt={main.alt || name}
          priority
          sizes="(max-width: 900px) 100vw, 560px"
        />
      </div>
      {sorted.length > 1 && (
        <div
          className="v3-gal-thumbs"
          role="tablist"
          aria-label={t("galleryImages")}
        >
          {sorted.map((img, i) => (
            <button
              key={img.url}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={t("galleryThumb", { n: i + 1 })}
              className={`v3-gal-thumb${i === active ? " is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              <SmartImage src={img.url} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
