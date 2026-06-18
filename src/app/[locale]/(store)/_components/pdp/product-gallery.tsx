"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { ProductImage } from "@/lib/queries/products";
import { SmartImage } from "../commerce/smart-image";

/* ProductGallery — main image + thumbnail strip. Keyboard accessible.
   Clicking the main image opens a full-screen lightbox built on the native
   <dialog> element (no JS library): native ESC-close + focus trap + backdrop;
   ArrowLeft/ArrowRight navigate between images. No zoom lib, no parallax. */

export function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const t = useTranslations("pdp");
  const tc = useTranslations("common");
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const [active, setActive] = useState(0);
  const main = sorted[active] ?? sorted[0];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openLightbox = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  // Restore focus to the triggering control once the native dialog closes.
  const onClose = useCallback(() => {
    triggerRef.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) => {
      const count = sorted.length;
      if (count < 2) return;
      setActive((i) => (i + delta + count) % count);
    },
    [sorted.length],
  );

  const onDialogKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    },
    [step],
  );

  // Close when the click lands on the dialog backdrop (outside the figure).
  const onDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) dialogRef.current?.close();
    },
    [],
  );

  if (!main) {
    return <div className="v3-gal v3-gal--empty" aria-hidden="true" />;
  }

  return (
    <div className="v3-gal">
      <button
        ref={triggerRef}
        type="button"
        className="v3-gal-main v3-gal-trigger"
        aria-label={t("galleryImages")}
        aria-haspopup="dialog"
        onClick={openLightbox}
      >
        <SmartImage
          src={main.url}
          alt={main.alt || name}
          priority
          sizes="(max-width: 900px) 100vw, 560px"
        />
      </button>
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

      <dialog
        ref={dialogRef}
        className="v3-gal-dialog"
        aria-label={t("galleryImages")}
        onClose={onClose}
        onClick={onDialogClick}
        onKeyDown={onDialogKeyDown}
      >
        <button
          type="button"
          className="v3-gal-dialog__close"
          aria-label={tc("close")}
          onClick={() => dialogRef.current?.close()}
        >
          <X size={22} strokeWidth={2.5} aria-hidden="true" />
        </button>
        <figure className="v3-gal-dialog__figure">
          {/* Full-res view is lazy/secondary so it never competes with the
              main image for LCP. */}
          <SmartImage src={main.url} alt={main.alt || name} sizes="100vw" />
        </figure>
        {sorted.length > 1 && (
          <div className="v3-gal-dialog__nav" role="group">
            <button
              type="button"
              className="v3-gal-dialog__arrow"
              aria-label={t("galleryThumb", {
                n: ((active - 1 + sorted.length) % sorted.length) + 1,
              })}
              onClick={() => step(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="v3-gal-dialog__arrow"
              aria-label={t("galleryThumb", {
                n: ((active + 1) % sorted.length) + 1,
              })}
              onClick={() => step(1)}
            >
              ›
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
