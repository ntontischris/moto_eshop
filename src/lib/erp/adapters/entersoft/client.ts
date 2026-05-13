/**
 * Entersoft Web API HTTP client.
 *
 * Auth: `X-ESAPIKEY-ECOMCONNECTOR` (composite key: apiKey1,apiKey2,clientId).
 * Server-side paging via `X-ESPQOptions` header.
 *
 * Notes:
 *  - The Entersoft IIS layer rejects raw `*` in URLs (returns ASP.NET
 *    request-path validation error). We URL-encode it to %2A.
 *  - Most Public Queries require sentinel `*` values for "unfiltered" params;
 *    leaving them out returns 400.
 */

const DEFAULT_BASE = "https://api.entersoft.gr/api/rpc/PublicQuery/ESWBCat";

export interface EntersoftClientOpts {
  apiKey: string;
  baseUrl?: string;
  /** Per-request timeout in ms (default 60s) */
  timeoutMs?: number;
}

export interface PageOptions {
  page: number;
  pageSize: number;
  withCount?: boolean;
}

export interface EsPagedResponse<T> {
  Table: string;
  Rows: T[];
  Page: number;
  PageSize: number;
  Count: number;
}

export class EntersoftHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string,
    public readonly body: string,
  ) {
    super(`Entersoft ${endpoint} → HTTP ${status}`);
    this.name = "EntersoftHttpError";
  }
}

export class EntersoftClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(opts: EntersoftClientOpts) {
    if (!opts.apiKey) throw new Error("EntersoftClient: apiKey is required");
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, "");
    this.timeoutMs = opts.timeoutMs ?? 60_000;
  }

  /**
   * Execute a Public Query. Returns the raw paged response.
   * Caller is responsible for mapping rows into domain types.
   */
  async pq<T>(
    endpoint: string,
    params: Record<string, string | number | undefined>,
    paging: PageOptions,
  ): Promise<EsPagedResponse<T>> {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      // ASP.NET rejects literal `*` in path validation. URLSearchParams
      // already encodes most special chars; force `*` encoding too.
      query.set(k, String(v));
    }
    // URLSearchParams does NOT encode `*` by default; do it manually.
    const queryStr = query.toString().replace(/\*/g, "%2A");

    const url = `${this.baseUrl}/${endpoint}?${queryStr}`;
    const headers: Record<string, string> = {
      "X-ESAPIKEY-ECOMCONNECTOR": this.apiKey,
      "X-ESPQOptions": JSON.stringify({
        WithCount: paging.withCount ?? true,
        Page: paging.page,
        PageSize: paging.pageSize,
      }),
      Accept: "application/json",
    };

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "GET",
        headers,
        signal: ctrl.signal,
        // Cache-bust: stock changes minute-to-minute on the ERP side.
        cache: "no-store",
      });
    } finally {
      clearTimeout(t);
    }

    if (!resp.ok) {
      const body = await resp.text().catch(() => "<unreadable>");
      throw new EntersoftHttpError(resp.status, endpoint, body.slice(0, 2000));
    }

    return (await resp.json()) as EsPagedResponse<T>;
  }

  /**
   * Iterate all pages of a PQ, calling `onPage` for each chunk.
   * Stops when the server returns fewer rows than `pageSize`.
   */
  async paginate<T>(
    endpoint: string,
    params: Record<string, string | number | undefined>,
    pageSize: number,
    onPage: (
      rows: T[],
      pageInfo: { page: number; total: number },
    ) => Promise<void> | void,
    opts: { delayMs?: number } = {},
  ): Promise<{ totalReturned: number; totalReported: number }> {
    let page = 1;
    let totalReturned = 0;
    let totalReported = 0;

    while (true) {
      const resp = await this.pq<T>(endpoint, params, {
        page,
        pageSize,
        withCount: page === 1,
      });
      if (page === 1) totalReported = resp.Count;
      totalReturned += resp.Rows.length;
      await onPage(resp.Rows, { page, total: totalReported });

      if (resp.Rows.length < pageSize) break;
      page++;
      if (opts.delayMs && opts.delayMs > 0) {
        await new Promise((r) => setTimeout(r, opts.delayMs));
      }
    }

    return { totalReturned, totalReported };
  }
}
