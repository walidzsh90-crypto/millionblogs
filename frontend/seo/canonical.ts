import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

export function createCanonicalPath(locale: Locale, path = "/"): string {
  return localizedPath(locale, path);
}
