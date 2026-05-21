import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Η παραγγελία καταχωρήθηκε | MotoMarket",
  robots: { index: false },
};

export default function CheckoutSuccess(props: {
  searchParams: Promise<{ order?: string }>;
}) {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessContent {...props} />
    </Suspense>
  );
}

async function CheckoutSuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <div className="v3-ok">
      <div className="v3-ok-mark" aria-hidden="true">
        ✓
      </div>
      <h1 className="v3-display">Ευχαριστούμε!</h1>
      <p className="v3-ok-lead">Η παραγγελία σου καταχωρήθηκε.</p>
      {order && (
        <p className="v3-ok-num">
          Αριθμός παραγγελίας: <strong>{order}</strong>
        </p>
      )}
      <p className="v3-ok-info">
        Πληρωμή με <strong>αντικαταβολή</strong> κατά την παράδοση. Θα
        επικοινωνήσουμε για επιβεβαίωση. Παράδοση σε 1–3 εργάσιμες.
      </p>
      <div className="v3-ok-cta">
        <Link className="v3-btn-primary" href="/">
          Στην αρχική <span aria-hidden="true">→</span>
        </Link>
        <Link className="v3-ok-cont" href="/category/eksoplismos-anabath">
          Συνέχισε τα ψώνια
        </Link>
      </div>
      <style precedence="default">{`
        .v3-ok { max-width: 640px; margin: 0 auto;
          padding: clamp(60px,12vw,140px) var(--v3-gutter);
          text-align: center; display: flex; flex-direction: column;
          align-items: center; gap: 14px; }
        .v3-ok-mark { width: 72px; height: 72px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--v3-green); color: var(--v3-carbon);
          font-size: 2.2rem; font-weight: 900; margin-bottom: 8px; }
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
