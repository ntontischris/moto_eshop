export interface Signals {
  source: string | null;
  utm: Record<string, string>;
  device: "mobile" | "desktop";
  country: string | null;
  isReturning: boolean;
  bucket: number;
}

export interface SignalInput {
  searchParams: Record<string, string | string[] | undefined>;
  userAgent: string | null;
  country: string | null;
  isReturning: boolean;
  bucket: number;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Pure extraction of decisioning signals from request-derived inputs.
 * The route gathers userAgent/country from headers and the sticky bucket from
 * a cookie, then hands them here so this stays unit-testable.
 */
export function extractSignals(input: SignalInput): Signals {
  const sp = input.searchParams;
  const utm: Record<string, string> = {};
  for (const key of Object.keys(sp)) {
    if (key.startsWith("utm_")) {
      const val = first(sp[key]);
      if (val) utm[key] = val;
    }
  }
  const source =
    first(sp.utm_source) ?? first(sp.source) ?? utm.utm_source ?? null;
  const ua = input.userAgent ?? "";
  const device = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";

  return {
    source,
    utm,
    device,
    country: input.country,
    isReturning: input.isReturning,
    bucket: input.bucket,
  };
}
