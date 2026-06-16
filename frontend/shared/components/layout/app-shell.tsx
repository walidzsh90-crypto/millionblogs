import type { ReactNode } from "react";

import type { Direction, Locale } from "@/i18n/config";

type AppShellProps = {
  children: ReactNode;
  locale: Locale;
  direction: Direction;
  surface: "public" | "auth" | "dashboard" | "founder" | "admin";
};

export function AppShell({ children, locale, direction, surface }: AppShellProps) {
  return (
    <div data-locale={locale} data-surface={surface} dir={direction} className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
