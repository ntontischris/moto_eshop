import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CampaignPurchaseTracker } from "@/lib/campaigns/campaign-purchase-tracker";
import CardConfirmation from "./card-confirmation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return {
    title: t("successMetaTitle"),
    robots: { index: false },
  };
}

export default function CheckoutSuccess(props: {
  searchParams: Promise<{ order?: string; cs?: string }>;
}) {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessContent {...props} />
      <SuccessStyles />
    </Suspense>
  );
}

async function CheckoutSuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; cs?: string }>;
}) {
  const { order, cs } = await searchParams;

  // Card path: the order is created by the webhook, so resolve it client-side
  // (brief "confirming…" → real order) rather than trusting the redirect.
  if (cs) {
    return <CardConfirmation sessionId={cs} />;
  }

  const t = await getTranslations("checkout");

  // COD path: the order already exists.
  let orderTotal: number | null = null;
  if (order) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("orders")
      .select("total")
      .eq("order_number", order)
      .maybeSingle();
    orderTotal = data?.total ?? null;
  }

  return (
    <div className="v3-ok">
      <CampaignPurchaseTracker value={orderTotal} />
      <div className="v3-ok-mark" aria-hidden="true">
        ✓
      </div>
      <h1 className="v3-display">{t("successThank")}</h1>
      <p className="v3-ok-lead">{t("successLead")}</p>
      {order && <p className="v3-ok-num">{t("successOrderNum", { order })}</p>}
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

function CheckoutSuccessFallback() {
  return (
    <div className="v3-ok" aria-hidden="true">
      <div className="v3-ok-mark" />
      <h1 className="v3-display">Loading</h1>
      <p className="v3-ok-lead">Preparing confirmation</p>
    </div>
  );
}

function SuccessStyles() {
  return (
    <style precedence="default">{`
      .v3-ok { max-width: 640px; margin: 0 auto;
        padding: clamp(60px,12vw,140px) var(--v3-gutter);
        text-align: center; display: flex; flex-direction: column;
        align-items: center; gap: 14px; }
      .v3-ok-mark { width: 72px; height: 72px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: var(--v3-green); color: var(--v3-carbon);
        font-size: 2.2rem; font-weight: 900; margin-bottom: 8px; }
      .v3-ok-spin { background: transparent;
        border: 4px solid var(--v3-bone-dim); border-top-color: var(--v3-cyan);
        animation: v3-ok-spin 0.8s linear infinite; }
      @keyframes v3-ok-spin { to { transform: rotate(360deg); } }
      .v3-ok h1 { margin: 0; font-size: clamp(2rem,6vw,3.4rem);
        font-weight: 900; text-transform: uppercase; transform: skewX(-6deg);
        color: var(--v3-bone); }
      .v3-ok-lead { margin: 0; color: var(--v3-bone); font-size: 1.05rem; }
      .v3-ok-num { margin: 0; color: var(--v3-bone-dim); }
      .v3-ok-num strong { color: var(--v3-cyan);
        font-family: var(--v3-display); letter-spacing: .04em; }
      .v3-ok-info { margin: 6px 0 0; max-width: 460px;
        color: var(--v3-bone-dim); font-size: .9rem; line-height: 1.55; }
      .v3-ok-cta { display: flex; flex-direction: column; gap: 12px;
        align-items: center; margin-top: 22px; }
      .v3-ok-cta .v3-btn-primary { text-decoration: none; }
      .v3-ok-cont { color: var(--v3-bone-dim); text-decoration: none;
        font-size: .85rem; }
      .v3-ok-cont:hover { color: var(--v3-bone); }
    `}</style>
  );
}
