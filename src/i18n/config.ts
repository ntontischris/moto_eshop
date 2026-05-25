export const locales = ["el", "en", "bg", "sr", "ro", "sq"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "el";

export const localeNames: Record<Locale, string> = {
  el: "Ελληνικά",
  en: "English",
  bg: "Български",
  sr: "Srpski",
  ro: "Română",
  sq: "Shqip",
};

export const localeFlags: Record<Locale, string> = {
  el: "/flags/gr.svg",
  en: "/flags/gb.svg",
  bg: "/flags/bg.svg",
  sr: "/flags/rs.svg",
  ro: "/flags/ro.svg",
  sq: "/flags/al.svg",
};

export function hasLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
