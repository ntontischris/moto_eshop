"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  normalizeSizeCode,
  SIZE_STATE_LABEL,
  type SizeVariant,
} from "../../_lib/size-availability";
import { getProductSizesBySlug } from "../../_lib/cart-stock";
import { useV3 } from "../shell/v3-provider";

/**
 * In-cart size selector (B1). Loads the product's [Size variant]s by slug, then
 * changes the line via the server action (which re-validates stock and merges
 * into an existing same-size line). Falls back to a static size label while
 * loading or when the product has no variants.
 */
export function CartLineSize({
  slug,
  lineId,
  currentSize,
}: {
  slug: string;
  lineId: string;
  currentSize: string;
}) {
  const t = useTranslations("cart");
  const { changeLineSize } = useV3();
  const [sizes, setSizes] = useState<SizeVariant[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getProductSizesBySlug(slug).then((s) => {
      if (active) setSizes(s);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  if (!sizes || sizes.length === 0) {
    return (
      <span className="v3-cart-size">
        {t("sizeLabel", { size: currentSize })}
      </span>
    );
  }

  // Guarantee the line's current size is always a selectable option, even if it
  // has since gone out of stock or dropped from the catalog.
  const options = sizes.some((v) => v.code === currentSize)
    ? sizes
    : [
        {
          code: currentSize,
          display: normalizeSizeCode(currentSize),
          available: 0,
          state: "out" as const,
        },
        ...sizes,
      ];

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (next === currentSize) return;
    setBusy(true);
    setError(false);
    const { ok } = await changeLineSize(lineId, next);
    setBusy(false);
    if (!ok) setError(true);
  };

  return (
    <div className="v3-cart-size-pick">
      <label className="v3-cart-size">
        <span className="v3-cart-size-word">{t("changeSize")}</span>
        <select
          className="v3-cart-size-select"
          value={currentSize}
          disabled={busy}
          aria-label={t("changeSize")}
          onChange={onChange}
        >
          {options.map((v) => (
            <option key={v.code} value={v.code} disabled={v.state === "out"}>
              {v.display}
              {v.state === "out" ? ` — ${SIZE_STATE_LABEL.out}` : ""}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <span className="v3-cart-size-err" role="alert">
          {t("sizeUnavailable")}
        </span>
      )}
    </div>
  );
}
