"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { recordCampaignEvent } from "./events";

/**
 * Mounted on the checkout success page. If the visitor arrived via a campaign
 * LP (attribution cookie set by CampaignTracker), records a `purchase` event
 * with the order revenue, then clears the cookie so it counts once.
 */
export function CampaignPurchaseTracker({ value }: { value: number | null }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const cookie = Cookies.get("mm_campaign");
    if (!cookie) return;
    const [campaignId, variantId] = cookie.split(":");
    if (!campaignId) return;

    void recordCampaignEvent({
      campaignId,
      variantId: variantId ?? null,
      type: "purchase",
      value,
    });
    Cookies.remove("mm_campaign");
  }, [value]);

  return null;
}
