import Link from "next/link";
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "../_lib/format";
import { SignOutButton } from "../_components/auth/sign-out-button";

export const metadata: Metadata = {
  title: "Ο λογαριασμός μου | MotoMarket",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getAuthUser();

  if (!user) {
    return (
      <div className="v3-acc v3-acc-guest">
        <h1 className="v3-display">Λογαριασμός</h1>
        <p>Συνδέσου για να δεις τις παραγγελίες και τα στοιχεία σου.</p>
        <div className="v3-acc-cta">
          <Link className="v3-btn-primary" href="/login?redirectTo=/account">
            Σύνδεση <span aria-hidden="true">→</span>
          </Link>
          <Link className="v3-acc-alt" href="/register?redirectTo=/account">
            Εγγραφή
          </Link>
        </div>
        <AccStyles />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, total, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="v3-acc">
      <header className="v3-acc-head">
        <div>
          <h1 className="v3-display">Ο λογαριασμός μου</h1>
          <p className="v3-acc-email">{user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <section className="v3-acc-sec">
        <h2 className="v3-display">Παραγγελίες</h2>
        {orders && orders.length > 0 ? (
          <div className="v3-acc-orders">
            {orders.map((o) => (
              <div key={o.order_number} className="v3-acc-order">
                <span className="v3-acc-onum">{o.order_number}</span>
                <span className="v3-acc-odate">
                  {new Date(o.created_at).toLocaleDateString("el-GR")}
                </span>
                <span className="v3-acc-ostatus">{o.status}</span>
                <span className="v3-acc-ototal">{formatPrice(o.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="v3-acc-empty">
            Δεν έχεις παραγγελίες ακόμα.{" "}
            <Link href="/category/eksoplismos-anabath">Ξεκίνα τώρα →</Link>
          </p>
        )}
      </section>

      <AccStyles />
    </div>
  );
}

function AccStyles() {
  return (
    <style precedence="default">{`
      .v3-acc { max-width: 980px; margin: 0 auto;
        padding: 36px var(--v3-gutter) 90px; }
      .v3-acc-guest { display: flex; flex-direction: column;
        align-items: flex-start; gap: 18px; color: var(--v3-bone-dim); }
      .v3-acc h1 { margin: 0; font-size: clamp(1.9rem,5vw,3rem);
        font-weight: 900; text-transform: uppercase; transform: skewX(-6deg);
        color: var(--v3-bone); }
      .v3-acc-cta { display: flex; align-items: center; gap: 16px; }
      .v3-acc-cta .v3-btn-primary { text-decoration: none; }
      .v3-acc-alt, .v3-acc-empty a { color: var(--v3-cyan);
        text-decoration: none; font-weight: 600; }
      .v3-acc-head { display: flex; align-items: flex-start;
        justify-content: space-between; gap: 20px; margin-bottom: 36px; }
      .v3-acc-email { margin: 8px 0 0; color: var(--v3-bone-dim);
        font-size: .9rem; }
      .v3-acc-signout { background: none; border: 1px solid var(--v3-line);
        color: var(--v3-bone-dim); border-radius: 8px; padding: 10px 16px;
        font-weight: 700; font-size: .82rem; cursor: pointer;
        font-family: var(--v3-display); text-transform: uppercase;
        letter-spacing: .06em; }
      .v3-acc-signout:hover { border-color: var(--v3-red);
        color: var(--v3-bone); }
      .v3-acc-sec h2 { font-size: 1.1rem; font-weight: 800;
        text-transform: uppercase; color: var(--v3-bone);
        margin: 0 0 16px; }
      .v3-acc-orders { display: flex; flex-direction: column;
        border: 1px solid var(--v3-line); }
      .v3-acc-order { display: grid;
        grid-template-columns: 1.4fr 1fr 1fr auto; gap: 14px;
        padding: 14px 16px; border-bottom: 1px solid var(--v3-line);
        font-size: .88rem; color: var(--v3-bone-dim); align-items: center; }
      .v3-acc-order:last-child { border-bottom: none; }
      .v3-acc-onum { font-family: var(--v3-display); font-weight: 700;
        color: var(--v3-bone); letter-spacing: .03em; }
      .v3-acc-ototal { color: var(--v3-bone); font-weight: 800;
        text-align: right; }
      .v3-acc-ostatus { text-transform: uppercase; font-size: .74rem;
        letter-spacing: .08em; }
      .v3-acc-empty { color: var(--v3-bone-dim); }
      @media (max-width: 560px) {
        .v3-acc-order { grid-template-columns: 1fr 1fr;
          grid-template-areas: "num total" "date status"; }
      }
    `}</style>
  );
}
