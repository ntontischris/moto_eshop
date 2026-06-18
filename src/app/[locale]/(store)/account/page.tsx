import "./account.css";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getAuthUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "../_lib/format";
import { SignOutButton } from "../_components/auth/sign-out-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return {
    title: t("metaTitle"),
    robots: { index: false },
  };
}

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountFallback />}>
      <AccountContent />
    </Suspense>
  );
}

/**
 * Reserved account-section rail. INERT BY DESIGN (#122): these are presentation
 * placeholders for views that are out of scope this cycle. They render as
 * <span data-reserved> with aria-disabled and NO href/Link — wiring them to
 * /garage, /wishlist or an order-detail route (none of which exist yet) is a
 * follow-up cycle's job. Do not turn these into links.
 */
function ReservedAccountNav() {
  return (
    <nav className="v3-acc-nav" aria-label="Account sections">
      {/* RESERVED SLOT — garage view out of scope (#122) */}
      <span
        className="v3-acc-nav-slot"
        data-reserved="true"
        aria-disabled="true"
      >
        Garage
      </span>
      {/* RESERVED SLOT — wishlist view out of scope (#122) */}
      <span
        className="v3-acc-nav-slot"
        data-reserved="true"
        aria-disabled="true"
      >
        Wishlist
      </span>
      {/* RESERVED SLOT — order-detail view out of scope (#122) */}
      <span
        className="v3-acc-nav-slot"
        data-reserved="true"
        aria-disabled="true"
      >
        Order detail
      </span>
    </nav>
  );
}

async function AccountContent() {
  const t = await getTranslations("account");
  const user = await getAuthUser();

  if (!user) {
    return (
      <div className="v3-acc v3-acc-guest">
        <h1 className="v3-display">{t("guestHeading")}</h1>
        <p>{t("guestText")}</p>
        <div className="v3-acc-cta">
          <Link className="v3-btn-primary" href="/login?redirectTo=/account">
            {t("login")} <span aria-hidden="true">→</span>
          </Link>
          <Link className="v3-acc-alt" href="/register?redirectTo=/account">
            {t("register")}
          </Link>
        </div>
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
          <p className="v3-acc-eyebrow">MotoMarket</p>
          <h1 className="v3-display">{t("myAccount")}</h1>
          <p className="v3-acc-email">{user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <ReservedAccountNav />

      <section className="v3-acc-sec">
        <h2 className="v3-display">{t("ordersHeading")}</h2>
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
            {t("noOrders")}{" "}
            <Link href="/category/eksoplismos-anabath">{t("startNow")} →</Link>
          </p>
        )}
      </section>
    </div>
  );
}

function AccountFallback() {
  return (
    <div className="v3-acc" aria-hidden="true">
      <div className="h-10 w-72 rounded bg-white/10" />
      <div className="mt-4 h-24 rounded bg-white/10" />
    </div>
  );
}
