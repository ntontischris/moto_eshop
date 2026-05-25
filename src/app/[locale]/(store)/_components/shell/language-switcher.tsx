"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localeFlags, localeNames, type Locale } from "@/i18n/config";

export function LanguageSwitcher({ onSwitch }: { onSwitch?: () => void }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("lang");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectLocale(next: Locale) {
    setOpen(false);
    onSwitch?.();
    if (next !== locale) router.replace(pathname, { locale: next });
  }

  return (
    <div className="v3-lang" ref={ref}>
      <button
        type="button"
        className="v3-lang-btn"
        aria-label={t("switcherLabel")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={localeFlags[locale]}
          alt=""
          className="v3-lang-flag"
          width={22}
          height={16}
        />
        <span className="v3-lang-code">{locale.toUpperCase()}</span>
        <ChevronDown className="v3-lang-caret" size={13} aria-hidden="true" />
      </button>

      {open && (
        <ul
          className="v3-lang-menu"
          role="listbox"
          aria-label={t("switcherLabel")}
        >
          {routing.locales.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <button
                type="button"
                className={`v3-lang-opt${l === locale ? " is-active" : ""}`}
                onClick={() => selectLocale(l as Locale)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localeFlags[l]}
                  alt=""
                  className="v3-lang-flag"
                  width={22}
                  height={16}
                />
                <span>{localeNames[l]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
