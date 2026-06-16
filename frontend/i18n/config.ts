export const supportedLocales = ["en", "ar", "nl"] as const;

export type Locale = (typeof supportedLocales)[number];

export type Direction = "ltr" | "rtl";

export const defaultLocale: Locale = "en";

export const localeDirections: Record<Locale, Direction> = {
  en: "ltr",
  ar: "rtl",
  nl: "ltr"
};

export function isSupportedLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function getDirection(locale: Locale): Direction {
  return localeDirections[locale];
}
