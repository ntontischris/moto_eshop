import { NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { handlePaymentEvent } from "@/lib/payments/webhook-handler";
import { createAdminClient } from "@/lib/supabase/admin";

// NOTE: no `runtime`/`dynamic` route-segment exports — this build uses Next 16
// Cache Components (cacheComponents), which rejects them. A POST route handler
// is already uncached + Node runtime by default; signature verification reads
// the raw body via req.text().

/**
 * Thin webhook shell (ADR 0015): read raw body → verify signature → delegate
 * to the testable handler → return 200 only on durable success; any non-2xx
 * triggers a provider retry, so a transient failure is never a lost payment.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = await getPaymentProvider().verifyAndParseWebhook(
      rawBody,
      signature,
    );
  } catch {
    // Forged or malformed event — reject before any processing.
    return new Response("Invalid signature", { status: 400 });
  }

  const result = await handlePaymentEvent(event, createAdminClient());
  if (!result.ok) {
    return new Response("Processing failed", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
