"use client";

import { useEffect, useState } from "react";
import {
  endOfLocalDay,
  formatCountdown,
  timeRemaining,
} from "../../_lib/offers-countdown";

/* Live offers countdown — hydration-safe. The deadline depends on the visitor's
   local clock, which the server can't know (and reading `new Date()` during a
   Cache-Components prerender is disallowed). So we render a stable placeholder
   on the server AND on the first client paint — markup matches, no hydration
   mismatch — then start the real clock inside useEffect, recomputing each second.
   At the deadline it shows the expired label instead of going negative. Numbers
   use tabular figures (CSS) so each tick is the same width — no CLS. */

const PLACEHOLDER = "--:--:--";

export function OfferCountdown({
  label,
  expiredLabel,
}: {
  label: string;
  expiredLabel: string;
}) {
  const [display, setDisplay] = useState(PLACEHOLDER);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const parts = timeRemaining(now, endOfLocalDay(now));
      setExpired(parts.expired);
      setDisplay(formatCountdown(parts));
    };
    // Defer the first paint out of the effect body (avoids a synchronous
    // cascading render), then tick every second.
    const frame = requestAnimationFrame(tick);
    const id = window.setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(id);
    };
  }, []);

  return (
    <p className="v3-off-countdown" role="timer" aria-live="off">
      <span className="v3-off-countdown-value">{display}</span>
      <span className="v3-off-countdown-label">
        {expired ? expiredLabel : label}
      </span>
    </p>
  );
}
