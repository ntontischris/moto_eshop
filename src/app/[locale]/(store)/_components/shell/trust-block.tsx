import { getTranslations } from "next-intl/server";
import { TrustGrid, type TrustItem } from "./trust-grid";

export async function TrustBlock() {
  const t = await getTranslations("shell");

  const ITEMS: TrustItem[] = [
    {
      key: "official",
      title: t("trustOfficial"),
      line: t("trustOfficialLine"),
    },
    { key: "delivery", title: t("trustFast"), line: t("trustDeliveryLine") },
    { key: "fit", title: t("trustFit"), line: t("trustFitLine") },
    { key: "secure", title: t("trustSecureTitle"), line: t("trustSecureLine") },
    { key: "support", title: t("trustSupport"), line: t("trustSupportLine") },
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
      <TrustGrid items={ITEMS} />
    </section>
  );
}
