import { defaultLocale, isSupportedLocale, type Locale } from "./config";

export function resolveLocale(value: string | undefined): Locale {
  if (value && isSupportedLocale(value)) {
    return value;
  }

  return defaultLocale;
}

export function localizedPath(locale: Locale, path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function stripLocale(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0 && isSupportedLocale(parts[0])) {
    return `/${parts.slice(1).join("/")}`;
  }

  return pathname;
}
