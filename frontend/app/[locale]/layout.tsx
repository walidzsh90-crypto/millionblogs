import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { AppShell } from "@/shared/components/layout/app-shell";
import { ErrorBoundary } from "@/shared/components/error-boundary";
import { getDirection, isSupportedLocale, type Locale } from "@/i18n/config";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: localeParam } = await params;

  if (!isSupportedLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const direction = getDirection(locale);

  return (
    <AppShell locale={locale} direction={direction} surface="public">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppShell>
  );
}
