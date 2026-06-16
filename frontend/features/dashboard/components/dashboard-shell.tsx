import type { ReactNode } from "react";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

export function DashboardShell({ children, locale }: { children: ReactNode; locale: Locale }) {
  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <DashboardSidebar locale={locale} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader locale={locale} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-border px-6 py-4 text-xs text-muted">
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            <Link href={localizedPath(locale, "/privacy")}>Privacy Policy</Link>
            <Link href={localizedPath(locale, "/terms")}>Terms of Service</Link>
            <Link href={localizedPath(locale, "/cookies")}>Cookie Policy</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
