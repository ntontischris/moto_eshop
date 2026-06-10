/* Pure countdown math for the Velocità offers chapter — no DOM, no timers,
   fully unit-testable. The component (offer-countdown.tsx) renders a stable
   server value from these helpers, then ticks on the client via setInterval.
   Keeping the math a pure function of (now, endTime) makes it hydration-safe
   and testable without mocking the clock. */

export interface CountdownParts {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

/* End of the visitor's local day (23:59:59.999). The offer deadline is the
   local end-of-day unless an explicit end time is supplied — we never invent a
   fake backend, so absent real offer data this is the sensible default. */
export function endOfLocalDay(now: Date): Date {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end;
}

/* Whole hours/minutes/seconds left between now and endTime. Clamped at zero so
   a passed deadline degrades to 00:00:00 + expired instead of going negative. */
export function timeRemaining(now: Date, endTime: Date): CountdownParts {
  const totalSeconds = Math.max(
    0,
    Math.floor((endTime.getTime() - now.getTime()) / 1000),
  );
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: totalSeconds === 0,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/* HH:MM:SS with zero-padded segments (tabular numerals applied via CSS). */
export function formatCountdown(parts: CountdownParts): string {
  return `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
}
