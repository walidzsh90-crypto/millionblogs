import { getDirection, type Locale } from "@/i18n/config";

export function useDirection(locale: Locale) {
  return getDirection(locale);
}
