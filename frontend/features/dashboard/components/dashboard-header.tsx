import type { Locale } from "@/i18n/config";

import { UnreadBadge } from "@/features/notifications/components/unread-badge";
import { UserMenu } from "./user-menu";

export function DashboardHeader({ locale }: { locale: Locale }) {
  return (
    <header className="border-b border-border bg-background px-4 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-start">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Overview</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <UnreadBadge locale={locale} />
          <UserMenu locale={locale} />
        </div>
      </div>
    </header>
  );
}
