"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const TYPES = ["view", "cta_click", "add_to_cart", "purchase"] as const;
type EventType = (typeof TYPES)[number];

/**
 * Record a campaign analytics event. Inserts with the service-role key
 * (campaign_events has RLS on with no public policy). Callable from the client
 * tracker; the DB check constraint + this guard keep the type valid.
 */
export async function recordCampaignEvent(input: {
  campaignId: string;
  variantId: string | null;
  type: EventType;
  sessionId?: string | null;
  value?: number | null;
}): Promise<void> {
  if (!TYPES.includes(input.type)) return;
  const supabase = createAdminClient();
  await supabase.from("campaign_events").insert({
    campaign_id: input.campaignId,
    variant_id: input.variantId,
    type: input.type,
    session_id: input.sessionId ?? null,
    value: input.value ?? null,
  });
}
