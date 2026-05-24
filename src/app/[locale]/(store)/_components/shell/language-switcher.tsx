"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localeNames, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("lang");

  return (
    <select
      aria-label={t("switcherLabel")}
      value={locale}
      onChange={(e) =>
        router.replace(pathname, { locale: e.target.value as Locale })
      }
      className="v3-lang-switch"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
