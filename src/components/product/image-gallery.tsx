"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/queries/products";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: {
  images: ProductImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate(Math.max(0, currentIndex - 1));
      if (e.key === "ArrowRight")
        onNavigate(Math.min(images.length - 1, currentIndex + 1));
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, onNavigate, currentIndex, images.length]);

  const img = images[currentIndex];
  if (!img) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
        disabled={currentIndex === 0}
        className="absolute left-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white disabled:opacity-30 hover:bg-white/20"
        aria-label="Previous"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={() =>
          onNavigate(Math.min(images.length - 1, currentIndex + 1))
        }
        disabled={currentIndex === images.length - 1}
        className="absolute right-6 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white disabled:opacity-30 hover:bg-white/20"
        aria-label="Next"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      <div className="relative h-full max-h-[90vh] w-full max-w-6xl">
        <Image
          src={img.url}
          alt={img.alt}
          fill
          sizes="90vw"
          className="object-contain"
          priority
        />
      </div>
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/70">
        {currentIndex + 1} / {images.length}
      </p>
    </div>
  );
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const hasImages = images.length > 0;
  const current = hasImages ? (images[active] ?? images[0]) : null;
  const openLightbox = useCallback(() => setLightbox(true), []);

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {/* Vertical thumbs (desktop) / horizontal (mobile) — only shown if 2+ images */}
      {hasImages && images.length > 1 && (
        <div className="order-2 flex max-h-[480px] flex-row gap-2 overflow-x-auto md:order-1 md:flex-col md:overflow-y-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 bg-neutral-100 transition md:h-20 md:w-20",
                i === active
                  ? "border-brand-red"
                  : "border-transparent hover:border-neutral-300",
              )}
              aria-label={`Image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image (or empty-state placeholder if product has no images) */}
      {current ? (
        <button
          onClick={openLightbox}
          className="order-1 relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100 md:order-2 md:flex-1"
          aria-label="Open lightbox"
        >
          <Image
            src={current.url}
            alt={current.alt}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-contain transition-opacity duration-200"
            priority
          />
        </button>
      ) : (
        <div
          className="order-1 grid aspect-square w-full place-items-center rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 text-xs uppercase tracking-widest text-neutral-500 md:order-2 md:flex-1"
          aria-label="No image available"
        >
          {productName}
        </div>
      )}

      {lightbox && hasImages && (
        <Lightbox
          images={images}
          currentIndex={active}
          onClose={() => setLightbox(false)}
          onNavigate={setActive}
        />
      )}
    </div>
  );
}
