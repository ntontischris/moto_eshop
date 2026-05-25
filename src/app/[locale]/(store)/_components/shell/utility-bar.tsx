import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "./language-switcher";

export async function UtilityBar() {
  const t = await getTranslations("shell");
  const tc = await getTranslations("common");

  return (
    <div className="v3-utility-bar">
      <div className="v3-utility-status" aria-label="Store status">
        <span>{t("utilityOfficial")}</span>
        <i aria-hidden="true" />
        <span>{t("utilityShipping")}</span>
        <i aria-hidden="true" />
        <span>{t("utilitySizeChange")}</span>
      </div>
      <nav className="v3-utility-links" aria-label={t("utilityNav")}>
        <Link href="/account">{tc("account")}</Link>
        <Link href="/wishlist">{tc("wishlist")}</Link>
        <a href="tel:+302109535195">210 95 35 195</a>
        <LanguageSwitcher />
      </nav>
    </div>
  );
}
