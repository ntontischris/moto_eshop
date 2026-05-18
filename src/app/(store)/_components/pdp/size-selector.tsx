"use client";

/* SizeSelector — size chips (real buttons, not a dropdown). */

export function SizeSelector({
  sizes,
  value,
  onChange,
}: {
  sizes: string[];
  value: string | null;
  onChange: (s: string) => void;
}) {
  return (
    <div className="v3-size">
      <div className="v3-size-row" role="group" aria-label="Επιλογή μεγέθους">
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={value === s}
            className={`v3-size-chip${value === s ? " is-on" : ""}`}
            onClick={() => onChange(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
