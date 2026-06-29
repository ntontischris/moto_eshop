import { describe, it, expect } from "vitest";
import Stripe from "stripe";
import { StripeAdapter } from "./adapter";

const WEBHOOK_SECRET = "whsec_test_secret";
const stripe = new Stripe("sk_test_dummy");

function signedRequest(payload: object) {
  const body = JSON.stringify(payload);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret: WEBHOOK_SECRET,
  });
  return { body, signature };
}

const adapter = new StripeAdapter({
  secretKey: "sk_test_dummy",
  webhookSecret: WEBHOOK_SECRET,
});

describe("StripeAdapter.verifyAndParseWebhook", () => {
  it("parses a verified checkout.session.completed into a completed event", async () => {
    const { body, signature } = signedRequest({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          client_reference_id: "our-session-1",
        },
      },
    });

    const event = await adapter.verifyAndParseWebhook(body, signature);

    expect(event).toEqual({
      type: "completed",
      eventId: "evt_1",
      providerSessionId: "cs_test_123",
      checkoutSessionId: "our-session-1",
    });
  });

  it("maps checkout.session.expired to an expired event", async () => {
    const { body, signature } = signedRequest({
      id: "evt_2",
      type: "checkout.session.expired",
      data: {
        object: { id: "cs_test_456", client_reference_id: "our-session-2" },
      },
    });

    const event = await adapter.verifyAndParseWebhook(body, signature);

    expect(event.type).toBe("expired");
    if (event.type === "expired") {
      expect(event.providerSessionId).toBe("cs_test_456");
      expect(event.checkoutSessionId).toBe("our-session-2");
    }
  });

  it("maps an unhandled event type to ignored", async () => {
    const { body, signature } = signedRequest({
      id: "evt_3",
      type: "payment_intent.created",
      data: { object: { id: "pi_1" } },
    });

    const event = await adapter.verifyAndParseWebhook(body, signature);
    expect(event).toEqual({ type: "ignored", eventId: "evt_3" });
  });

  it("rejects a forged body whose signature does not match", async () => {
    const { signature } = signedRequest({
      id: "evt_4",
      type: "checkout.session.completed",
    });
    const tamperedBody = JSON.stringify({
      id: "evt_4_FORGED",
      type: "checkout.session.completed",
    });

    await expect(
      adapter.verifyAndParseWebhook(tamperedBody, signature),
    ).rejects.toThrow();
  });
});
