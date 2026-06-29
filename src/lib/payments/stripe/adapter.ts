/**
 * Stripe adapter — the first concrete `PaymentProvider`. Uses Stripe-hosted
 * Checkout sessions (no card data on our servers) and treats the verified
 * webhook as the single source of truth for payment outcome. See ADR 0010.
 */

import Stripe from "stripe";
import type {
  PaymentProvider,
  PaymentEvent,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
} from "../types";

export interface StripeAdapterOptions {
  secretKey: string;
  webhookSecret: string;
}

export class StripeAdapter implements PaymentProvider {
  readonly name = "stripe" as const;
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(opts: StripeAdapterOptions) {
    this.stripe = new Stripe(opts.secretKey);
    this.webhookSecret = opts.webhookSecret;
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      input.lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: input.currency,
          unit_amount: Math.round(l.unitPrice * 100),
          product_data: { name: l.name },
        },
      }));

    if (input.shippingAmount > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: input.currency,
          unit_amount: input.shippingAmount,
          product_data: { name: "Μεταφορικά" },
        },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: input.checkoutSessionId,
      customer_email: input.customerEmail,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      line_items: lineItems,
      metadata: { checkout_session_id: input.checkoutSessionId },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout redirect URL.");
    }

    return { providerSessionId: session.id, redirectUrl: session.url };
  }

  async verifyAndParseWebhook(
    rawBody: string,
    signature: string,
  ): Promise<PaymentEvent> {
    // Throws on a bad/forged signature — rejected before any processing.
    const event = await this.stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      this.webhookSecret,
    );
    return parseStripeEvent(event);
  }
}

/** Normalizes a verified Stripe event into our provider-agnostic shape. */
function parseStripeEvent(event: Stripe.Event): PaymentEvent {
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.expired"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    return {
      type:
        event.type === "checkout.session.completed" ? "completed" : "expired",
      eventId: event.id,
      providerSessionId: session.id,
      checkoutSessionId: session.client_reference_id ?? null,
    };
  }
  return { type: "ignored", eventId: event.id };
}
