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
  onNavigate: (index: number) => void;
}) {
  const image = images[currentIndex];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate(Math.max(0, currentIndex - 1));
      if (e.key === "ArrowRight")
        onNavigate(Math.min(images.length - 1, currentIndex + 1));
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, onNavigate, currentIndex, images.length]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Lightbox"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative h-[80vh] w-[80vw]"
      >
        <Image
          src={image.url}
          alt={image.alt}
          fill
          className="object-contain"
          sizes="80vw"
          priority
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Κλείσιμο"
      >
        <X className="h-6 w-6" />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Προηγούμενη εικόνα"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() =>
              onNavigate(Math.min(images.length - 1, currentIndex + 1))
            }
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Επόμενη εικόνα"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <div className="absolute bottom-4 text-sm text-white/70">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

function ThumbnailStrip({
  images,
  activeIndex,
  onSelect,
}: {
  images: ProductImage[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2">
      {images.map((image, index) => (
        <button
          key={`${image.url}-${index}`}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
            index === activeIndex
              ? "border-primary"
              : "border-transparent hover:border-muted-foreground/30",
          )}
          aria-label={`Εικόνα ${index + 1}`}
        >
          <Image
            src={image.url}
            alt={image.alt}
            fill
            className="object-cover"
            sizes="64px"
          />
        </button>
      ))}
    </div>
  );
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const openLightbox = useCallback(() => setIsLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setIsLightboxOpen(false), []);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src="/images/placeholder-product.webp"
          alt={productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openLightbox}
        className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg bg-muted"
        aria-label="Κλικ για μεγέθυνση"
      >
        {activeImage && (
          <Image
            src={activeImage.url}
            alt={activeImage.alt}
            fill
            className="object-cover transition-transform duration-200 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        )}
      </button>
      {images.length > 1 && (
        <ThumbnailStrip
          images={images}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      )}
      {isLightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={activeIndex}
          onClose={closeLightbox}
          onNavigate={setActiveIndex}
        />
      )}
    </div>
  );
}
