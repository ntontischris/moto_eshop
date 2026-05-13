/**
 * ERP adapter factory.
 * Reads ERP_PROVIDER + provider-specific env, returns the right adapter.
 *
 * Today only Entersoft is supported. When Odoo is wired up, add a branch
 * here — the rest of the app keeps consuming `IErpAdapter`.
 */

import type { IErpAdapter } from "./types";
import { EntersoftAdapter } from "./adapters/entersoft/adapter";

export type ErpProvider = "entersoft" | "odoo";

export function getErpProvider(): ErpProvider {
  const v = (process.env.ERP_PROVIDER ?? "entersoft").toLowerCase();
  if (v === "odoo") return "odoo";
  return "entersoft";
}

let cached: IErpAdapter | null = null;

export function getErp(): IErpAdapter {
  if (cached) return cached;

  const provider = getErpProvider();
  if (provider === "entersoft") {
    const apiKey = process.env.ENTERSOFT_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ENTERSOFT_API_KEY is not set. Add it to .env.local before using the ERP adapter.",
      );
    }
    cached = new EntersoftAdapter({
      apiKey,
      baseUrl: process.env.ENTERSOFT_API_URL,
    });
    return cached;
  }
  throw new Error(`ERP provider "${provider}" is not implemented yet.`);
}

export type { IErpAdapter };
export * from "./types";
