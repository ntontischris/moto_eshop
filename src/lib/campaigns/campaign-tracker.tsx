"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { recordCampaignEvent } from "./events";

/**
 * Mounted on a published landing page. Persists the sticky session id and the
 * attribution cookie (read at checkout), and records the `view` event once.
 * All cookie writes happen here because a Server Component render cannot set
 * cookies.
 */
export function CampaignTracker({
  campaignId,
  variantId,
  sid,
}: {
  campaignId: string;
  variantId: string;
  sid: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    if (!Cookies.get("mm_sid")) {
      Cookies.set("mm_sid", sid, { expires: 365, sameSite: "lax" });
    }
    Cookies.set("mm_campaign", `${campaignId}:${variantId}`, {
      expires: 7,
      sameSite: "lax",
    });

    void recordCampaignEvent({
      campaignId,
      variantId,
      type: "view",
      sessionId: sid,
    });
  }, [campaignId, variantId, sid]);

  return null;
}
