import { getTranslations } from "next-intl/server";
import {
  CreditCard,
  Headphones,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

export async function TrustBlock() {
  const t = await getTranslations("shell");

  const ITEMS = [
    {
      key: "official",
      title: "Official supply",
      line: t("trustOfficialLine"),
      icon: ShieldCheck,
    },
    {
      key: "delivery",
      title: "Fast delivery",
      line: t("trustDeliveryLine"),
      icon: PackageCheck,
    },
    {
      key: "fit",
      title: "Fit confidence",
      line: t("trustFitLine"),
      icon: RotateCcw,
    },
    {
      key: "secure",
      title: "Secure checkout",
      line: t("trustSecureLine"),
      icon: CreditCard,
    },
    {
      key: "support",
      title: "Rider support",
      line: t("trustSupportLine"),
      icon: Headphones,
    },
  ];

  return (
    <section
      className="v3-trust v3-trust--reconstructed"
      aria-label={t("trustWhy")}
    >
      <div className="v3-trust-head">
        <p className="v3-label">Trust</p>
        <h2 className="v3-display">{t("trustHeading")}</h2>
      </div>
      <div className="v3-trust-grid">
        {ITEMS.map(({ key, title, line, icon: Icon }) => (
          <div key={key} className="v3-trust-cell">
            <Icon size={26} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{line}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
