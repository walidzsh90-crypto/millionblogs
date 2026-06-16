import type { ReactNode } from "react";

import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { SurfaceLayout } from "@/shared/components/layout/surface-layout";

type DashboardLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale: localeParam } = await params;
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  return (
    <SurfaceLayout surface="dashboard">
      <DashboardShell locale={locale}>{children}</DashboardShell>
    </SurfaceLayout>
  );
}
