"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  sizes: string[];
  colors: string[];
}

export function VariantSelector({ sizes, colors }: VariantSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {sizes.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium">
            Μέγεθος{selectedSize ? `: ${selectedSize}` : ""}
          </label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedSize === size
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:border-primary hover:bg-accent",
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
      {colors.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium">
            Χρώμα{selectedColor ? `: ${selectedColor}` : ""}
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedColor === color
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:border-primary hover:bg-accent",
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
