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
      <style precedence="default">{`
        .v3-size-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .v3-size-chip {
          min-width: 48px; height: 44px; padding: 0 14px; cursor: pointer;
          background: var(--v3-surface); color: var(--v3-bone);
          border: 1px solid var(--v3-line); border-radius: 8px;
          font-weight: 700; font-size: .9rem;
          transition: border-color .12s, background .12s;
        }
        .v3-size-chip:hover { border-color: var(--v3-bone-dim); }
        .v3-size-chip.is-on {
          border-color: var(--v3-red); background: var(--v3-red); color: #fff;
        }
        .v3-size-chip:focus-visible {
          outline: 2px solid var(--v3-cyan); outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
