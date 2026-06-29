"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useV3 } from "../../_components/shell/v3-provider";
import { CampaignPurchaseTracker } from "@/lib/campaigns/campaign-purchase-tracker";
import { resolveCheckoutSession, type ResolveResult } from "./actions";

const POLL_MS = 1500;
const MAX_POLLS = 30; // ~45s before giving up

/**
 * Card success view: the order exists only once the webhook confirms payment,
 * so we poll the Checkout session and show a brief "confirming…" state that
 * resolves into the real order — never a fake thank-you (ADR 0015).
 */
export default function CardConfirmation({ sessionId }: { sessionId: string }) {
  const t = useTranslations("checkout");
  const { clearCart } = useV3();
  const [result, setResult] = useState<ResolveResult>({ status: "pending" });

  useEffect(() => {
    let active = true;
    let polls = 0;

    async function poll() {
      const res = await resolveCheckoutSession(sessionId);
      if (!active) return;
      if (res.status === "completed") {
        clearCart();
        setResult(res);
        return;
      }
      if (res.status === "expired" || res.status === "not_found") {
        setResult(res);
        return;
      }
      polls += 1;
      if (polls >= MAX_POLLS) {
        setResult({ status: "pending" });
        return;
      }
      setTimeout(poll, POLL_MS);
    }

    poll();
    return () => {
      active = false;
    };
  }, [sessionId, clearCart]);

  if (result.status === "completed") {
    return (
      <div className="v3-ok">
        <CampaignPurchaseTracker value={result.total} />
        <div className="v3-ok-mark" aria-hidden="true">
          ✓
        </div>
        <h1 className="v3-display">{t("successThank")}</h1>
        <p className="v3-ok-lead">{t("successLead")}</p>
        <p className="v3-ok-num">
          {t("successOrderNum", { order: result.orderNumber })}
        </p>
        <p className="v3-ok-info">{t("successInfo")}</p>
        <div className="v3-ok-cta">
          <Link className="v3-btn-primary" href="/">
            {t("successHome")} <span aria-hidden="true">→</span>
          </Link>
          <Link className="v3-ok-cont" href="/category/eksoplismos-anabath">
            {t("successContinue")}
          </Link>
        </div>
      </div>
    );
  }

  if (result.status === "expired" || result.status === "not_found") {
    return (
      <div className="v3-ok">
        <h1 className="v3-display">{t("successThank")}</h1>
        <p className="v3-ok-lead">{t("payConfirmError")}</p>
        <div className="v3-ok-cta">
          <Link className="v3-btn-primary" href="/checkout">
            {t("backToCart")} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="v3-ok" aria-live="polite">
      <div className="v3-ok-mark v3-ok-spin" aria-hidden="true" />
      <h1 className="v3-display">{t("payConfirming")}</h1>
      <p className="v3-ok-lead">{t("payConfirmingLead")}</p>
    </div>
  );
}
