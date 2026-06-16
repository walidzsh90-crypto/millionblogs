import { supportedLocales, type Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

export function createHreflangAlternates(path: string): Record<Locale | "x-default", string> {
  const alternates = supportedLocales.reduce(
    (result, locale) => ({
      ...result,
      [locale]: localizedPath(locale, path)
    }),
    {} as Record<Locale, string>
  );

  return {
    ...alternates,
    "x-default": localizedPath("en", path)
  };
}
