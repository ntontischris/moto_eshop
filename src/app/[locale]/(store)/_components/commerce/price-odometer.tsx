"use client";

import { useEffect, useState } from "react";
import { odometerColumns } from "../../_lib/card-interactions";

const ROLL_STEPS = 6;
const STEP_MS = 55;

interface PriceOdometerProps {
  /** The already-formatted, server-authoritative price string. */
  formatted: string;
  /** True while the parent card is hovered/focused on a fine pointer. */
  rolling: boolean;
}

/* Presentation-only price roll. The final value is always the `formatted`
   string handed down from the server price; we merely animate the digits up to
   it on hover. Tabular numerals + a fixed per-column width keep the reserved
   space identical to the resting state, so the roll never shifts layout. */
export function PriceOdometer({ formatted, rolling }: PriceOdometerProps) {
  const columns = odometerColumns(formatted, rolling ? ROLL_STEPS : 0);

  return (
    <span className="v3-odometer" aria-hidden="true">
      {columns.map((col, i) =>
        col.isDigit ? (
          <OdometerDigit
            key={`d-${i}-${rolling}`}
            roll={col.roll}
            active={rolling}
          />
        ) : (
          <span key={`s-${i}`} className="v3-odometer-sep">
            {col.char === " " ? " " : col.char}
          </span>
        ),
      )}
    </span>
  );
}

/* One rolling digit column. It steps through its `roll` frames once per hover,
   then holds on the final (target) digit. When inactive it renders the target
   immediately — no animation, no flicker. */
function OdometerDigit({ roll, active }: { roll: string[]; active: boolean }) {
  const last = roll.length - 1;
  const target = roll[last] ?? "0";
  const canRoll = active && roll.length > 1;
  // `step` advances through the roll frames while active. When inactive we show
  // the target directly and never touch state, so the effect stays side-effect
  // free (no synchronous setState / cascading renders) at rest.
  // Mounts fresh on each hover (parent keys digits on `rolling`), so state
  // starts at 0 naturally — the effect only schedules the climb, never resets.
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!canRoll) return;
    const timer = setInterval(() => {
      setStep((s) => {
        const next = s + 1;
        if (next >= last) clearInterval(timer);
        return next;
      });
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [canRoll, last]);

  const display = canRoll ? (roll[step] ?? target) : target;
  return <span className="v3-odometer-digit">{display}</span>;
}
