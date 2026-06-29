/**
 * Provider-agnostic payment types. Every adapter (Stripe today, Viva later)
 * normalizes its data into these shapes before the rest of the app sees it,
 * mirroring `IErpAdapter`. Card data never touches our servers — the customer
 * pays on a provider-hosted Checkout session. See ADR 0010 + CONTEXT.md.
 *
 * Keep this file dependency-free.
 */

export type PaymentProviderName = "stripe" | "viva";

/** A single server-priced line, snapshotted into the Checkout session. */
export interface CheckoutLineSnapshot {
  productId: string;
  slug: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CreateCheckoutSessionInput {
  /** Our `checkout_sessions.id` — round-tripped so the webhook can find it. */
  checkoutSessionId: string;
  /** Server-computed amount in EUR minor units (cents). Authoritative. */
  amountTotal: number;
  /** Shipping in EUR minor units (cents); added as its own line when > 0. */
  shippingAmount: number;
  currency: "eur";
  customerEmail: string;
  lines: CheckoutLineSnapshot[];
  /** Where the provider returns the customer on success / cancel. */
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResult {
  /** Provider-hosted session id (e.g. Stripe `cs_test_...`). */
  providerSessionId: string;
  /** The hosted page URL to redirect the customer to. */
  redirectUrl: string;
}

/**
 * A normalized, provider-agnostic payment event parsed from a verified
 * webhook. `ignored` covers event types the tracer does not act on.
 */
export type PaymentEvent =
  | {
      type: "completed";
      eventId: string;
      providerSessionId: string;
      /** Our `checkout_sessions.id`, echoed back by the provider. */
      checkoutSessionId: string | null;
    }
  | {
      type: "expired";
      eventId: string;
      providerSessionId: string;
      checkoutSessionId: string | null;
    }
  | { type: "ignored"; eventId: string };

export interface PaymentProvider {
  readonly name: PaymentProviderName;

  /** Creates a provider-hosted Checkout session and returns its redirect URL. */
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult>;

  /**
   * Verifies the webhook signature against the raw request body and returns a
   * normalized event. Throws if the signature is invalid (forged events are
   * rejected before any processing).
   */
  verifyAndParseWebhook(
    rawBody: string,
    signature: string,
  ): Promise<PaymentEvent>;
}
