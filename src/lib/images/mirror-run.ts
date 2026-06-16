/**
 * I/O-free orchestration helpers for the image-evacuation CLI (ADR 0005). The
 * sharp/hash core lives in `./mirror`; the runnable wiring (Supabase + network)
 * lives in `scripts/mirror-images.ts`. Everything here is pure so it can be
 * unit-tested without a bucket or the legacy origin.
 */

/** Default bounded fan-out — gentle on the dying legacy origin. */
export const DEFAULT_CONCURRENCY = 6;

export interface MirrorArgs {
  dryRun: boolean;
  /** Cap on products processed this run; null = no cap. */
  limit: number | null;
  concurrency: number;
}

/** A failed image, kept with its source URL so the report is actionable. */
export interface MirrorFailure {
  source: string;
  reason: string;
}

export interface MirrorReport {
  products: number;
  productsOk: number;
  productsFailed: number;
  imagesUploaded: number;
  imagesSkipped: number;
  failures: MirrorFailure[];
}

function numericFlag(argv: string[], flag: string): number | null {
  const i = argv.indexOf(flag);
  if (i < 0) return null;
  const value = Number(argv[i + 1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function parseMirrorArgs(argv: string[]): MirrorArgs {
  return {
    dryRun: argv.includes("--dry-run"),
    limit: numericFlag(argv, "--limit"),
    concurrency: numericFlag(argv, "--concurrency") ?? DEFAULT_CONCURRENCY,
  };
}

/**
 * The raw legacy image URLs for a product, ordered the way the storefront
 * orders them (object form by `position`, string form by array index). Mirrors
 * the ordering in `resolveImages` but returns un-proxied URLs for download.
 */
export function legacyImageUrls(rawImages: unknown): string[] {
  if (!Array.isArray(rawImages)) return [];
  return rawImages
    .map((img, idx) =>
      typeof img === "string"
        ? { url: img, position: idx }
        : {
            url:
              typeof (img as { url?: unknown })?.url === "string"
                ? (img as { url: string }).url
                : "",
            position:
              typeof (img as { position?: unknown })?.position === "number"
                ? (img as { position: number }).position
                : idx,
          },
    )
    .filter((img) => img.url.length > 0)
    .sort((a, b) => a.position - b.position)
    .map((img) => img.url);
}

/**
 * Run `fn` over `items` with at most `limit` promises in flight, preserving
 * input order in the results. A tiny worker-pool so we don't add a dependency
 * just to bound fan-out across ~18k images.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!, index);
    }
  };
  const pool = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: pool }, worker));
  return results;
}

/** Human-readable ✓/✗ coverage report with every failure listed explicitly. */
export function formatReport(report: MirrorReport): string {
  const lines = [
    `Mirror report — ${report.products} products`,
    `  ✓ ${report.productsOk} ok   ✗ ${report.productsFailed} failed`,
    `  images: ${report.imagesUploaded} uploaded, ${report.imagesSkipped} skipped (already mirrored)`,
  ];
  if (report.failures.length > 0) {
    lines.push(`  failures (${report.failures.length}):`);
    for (const f of report.failures)
      lines.push(`    ✗ ${f.source} — ${f.reason}`);
  } else {
    lines.push("  ✓ no failures");
  }
  return lines.join("\n");
}
