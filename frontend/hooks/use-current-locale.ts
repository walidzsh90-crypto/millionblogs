import { defaultLocale, isSupportedLocale, type Locale } from "@/i18n/config";

export function useCurrentLocale(value?: string): Locale {
  if (value && isSupportedLocale(value)) {
    return value;
  }

  return defaultLocale;
}
