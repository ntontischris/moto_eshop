import { describe, it, expect } from "vitest";
import { StripeAdapter } from "./adapter";

// Thin integration test against Stripe TEST mode (a live sandbox, no KYC).
// Skipped unless STRIPE_SECRET_KEY is present, so CI and key-less runs stay
// green. Run locally with a test key in .env.local to exercise the real call.
const secretKey = process.env.STRIPE_SECRET_KEY;

describe.skipIf(!secretKey)(
  "StripeAdapter.createCheckoutSession (Stripe test mode)",
  () => {
    it("returns a session id and a hosted redirect URL", async () => {
      const adapter = new StripeAdapter({
        secretKey: secretKey!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_unused",
      });

      const result = await adapter.createCheckoutSession({
        checkoutSessionId: "integration-test-session",
        amountTotal: 20500,
        shippingAmount: 500,
        currency: "eur",
        customerEmail: "integration@motomarket.test",
        lines: [
          {
            productId: "p-1",
            slug: "helmet",
            name: "Test Helmet",
            quantity: 1,
            unitPrice: 200,
            lineTotal: 200,
          },
        ],
        successUrl:
          "https://example.com/checkout/success?cs=integration-test-session",
        cancelUrl: "https://example.com/checkout?canceled=1",
      });

      expect(result.providerSessionId).toMatch(/^cs_test_/);
      expect(result.redirectUrl).toContain("https://");
    });
  },
);
