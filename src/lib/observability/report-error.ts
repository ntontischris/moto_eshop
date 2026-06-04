export interface ErrorContext {
  [key: string]: unknown;
}

// Process-local monotonic counter keeps event ids unique within a run without
// Math.random (deterministic, testable).
let seq = 0;

/**
 * The single choke point for runtime error reporting. Returns an event id the
 * UI can surface to the user for support. Today: structured server-side log.
 * Future: forward to a provider when `SENTRY_DSN` is set — same signature, one
 * body swap (record the swap as an ADR before doing it).
 */
export function reportError(error: unknown, context?: ErrorContext): string {
  const eventId = `evt_${Date.now().toString(36)}_${(seq++).toString(36)}`;
  const normalized =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };

  console.error("[reportError]", {
    eventId,
    ...normalized,
    context: context ?? {},
  });

  return eventId;
}
