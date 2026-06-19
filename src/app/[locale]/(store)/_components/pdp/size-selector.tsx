"use client";

import { useTranslations } from "next-intl";
import {
  SIZE_STATE_LABEL,
  type SizeVariant,
} from "../../_lib/size-availability";

export function SizeSelector({
  variants,
  value,
  onChange,
}: {
  variants: SizeVariant[];
  value: string | null;
  onChange: (code: string) => void;
}) {
  const t = useTranslations("pdp");

  return (
    <div className="v3-size">
      <div
        className="v3-size-row"
        role="group"
        aria-label={t("sizeGroupLabel")}
      >
        {variants.map((v) => {
          const out = v.state === "out";
          // The label keeps the raw [Size code] in the aria-label so screen
          // readers and tests can resolve back to the authoritative value.
          return (
            <button
              key={v.code}
              type="button"
              aria-pressed={value === v.code}
              aria-label={`${v.display} — ${SIZE_STATE_LABEL[v.state]}`}
              disabled={out}
              data-size-state={v.state}
              className={`v3-size-chip${value === v.code ? " is-on" : ""}${
                out ? " is-out" : ""
              }`}
              onClick={() => onChange(v.code)}
            >
              {v.display}
              <span className="v3-size-stock" data-slot="size-stock">
                {SIZE_STATE_LABEL[v.state]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
