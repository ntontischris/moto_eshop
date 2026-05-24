"use client";

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
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            aria-pressed={value === size}
            className={`v3-size-chip${value === size ? " is-on" : ""}`}
            onClick={() => onChange(size)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
