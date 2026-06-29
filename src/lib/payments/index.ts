/**
 * Payment provider factory.
 * Reads PAYMENT_PROVIDER + provider-specific env, returns the right adapter.
 *
 * Today only Stripe is supported. When Viva is wired up, add a branch here —
 * the rest of the app keeps consuming `PaymentProvider`. Mirrors `getErp()`.
 */

import type { PaymentProvider, PaymentProviderName } from "./types";
import { StripeAdapter } from "./stripe/adapter";

export function getPaymentProviderName(): PaymentProviderName {
  const v = (process.env.PAYMENT_PROVIDER ?? "stripe").toLowerCase();
  if (v === "viva") return "viva";
  return "stripe";
}

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  const provider = getPaymentProviderName();
  if (provider === "stripe") {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secretKey || !webhookSecret) {
      throw new Error(
        "STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are not set. Add them to .env.local before using card payments.",
      );
    }
    cached = new StripeAdapter({ secretKey, webhookSecret });
    return cached;
  }
  throw new Error(`Payment provider "${provider}" is not implemented yet.`);
}

/**
 * Card payment is offered only when a provider is configured (key present);
 * COD is always available. Lets card roll out behind a flag without breaking
 * the live COD checkout. See ADR 0010.
 */
export function isCardPaymentEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type { PaymentProvider };
export * from "./types";
