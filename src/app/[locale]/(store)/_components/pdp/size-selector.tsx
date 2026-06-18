"use client";

import { useTranslations } from "next-intl";

export function SizeSelector({
  sizes,
  value,
  onChange,
}: {
  sizes: string[];
  value: string | null;
  onChange: (s: string) => void;
}) {
  const t = useTranslations("pdp");

  return (
    <div className="v3-size">
      <div
        className="v3-size-row"
        role="group"
        aria-label={t("sizeGroupLabel")}
      >
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={value === size}
            className={`v3-size-chip${value === size ? " is-on" : ""}`}
            onClick={() => onChange(size)}
          >
            {size}
            {/* S-2.8 per-size stock badge slot — inert (populated in S-2.8) */}
            <span
              className="v3-size-stock"
              data-slot="size-stock"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
