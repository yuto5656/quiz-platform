export const locales = ["ja", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ja";

export const localeNames: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
};

export const localeFlags: Record<Locale, string> = {
  ja: "🇯🇵",
  en: "🇺🇸",
};
