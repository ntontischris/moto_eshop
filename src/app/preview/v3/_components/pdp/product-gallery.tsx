"use client";

import { useState } from "react";
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
          aria-label="Εικόνες προϊόντος"
        >
          {sorted.map((img, i) => (
            <button
              key={img.url}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Εικόνα ${i + 1}`}
              className={`v3-gal-thumb${i === active ? " is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              <SmartImage src={img.url} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}
      <style precedence="default">{`
        .v3-gal { display: flex; flex-direction: column; gap: 12px; }
        .v3-gal-main {
          position: relative; width: 100%; aspect-ratio: 1 / 1;
          border-radius: var(--v3-radius); overflow: hidden;
          background: var(--v3-surface); border: 1px solid var(--v3-line);
        }
        .v3-gal--empty { aspect-ratio: 1 / 1; background: var(--v3-surface);
          border-radius: var(--v3-radius); }
        .v3-gal-thumbs { display: flex; gap: 10px; flex-wrap: wrap; }
        .v3-gal-thumb {
          position: relative; width: 72px; height: 72px; padding: 0;
          border-radius: 8px; overflow: hidden; cursor: pointer;
          background: var(--v3-surface);
          border: 2px solid var(--v3-line);
        }
        .v3-gal-thumb.is-active { border-color: var(--v3-red); }
        .v3-gal-thumb:focus-visible {
          outline: 2px solid var(--v3-cyan); outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
