"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

type DashboardSidebarProps = {
  locale: Locale;
};

function SidebarLink({
  href,
  children,
  currentPath,
}: {
  href: string;
  children: ReactNode;
  currentPath: string;
}) {
  const isActive = currentPath === href || currentPath.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-semibold ${
        isActive
          ? "bg-primary text-white"
          : "text-foreground hover:bg-muted/20"
      }`}
    >
      {children}
    </Link>
  );
}

export function DashboardSidebar({ locale }: DashboardSidebarProps) {
  const pathname = usePathname();
  const stripped = pathname.replace(/^\/(en|ar|nl)/, "");

  const dashboardItems = [
    { href: localizedPath(locale, "/dashboard"), label: "Overview" },
    { href: localizedPath(locale, "/dashboard/blogs"), label: "My Blogs" },
    { href: localizedPath(locale, "/dashboard/feeds"), label: "RSS Feeds" },
    { href: localizedPath(locale, "/dashboard/articles"), label: "Articles" },
    { href: localizedPath(locale, "/dashboard/notifications"), label: "Notifications" },
    { href: localizedPath(locale, "/dashboard/support"), label: "Support" },
    { href: localizedPath(locale, "/dashboard/founder"), label: "Founder" },
    { href: localizedPath(locale, "/dashboard/subscriptions"), label: "Subscriptions" },
    { href: localizedPath(locale, "/dashboard/promotions"), label: "Promotions" },
    { href: localizedPath(locale, "/dashboard/wallet"), label: "Wallet" },
    { href: localizedPath(locale, "/dashboard/purchase"), label: "Buy Credits" },
  ];

  return (
    <aside className="border-b border-border bg-surface px-4 py-4 md:min-h-screen md:w-72 md:border-b-0 md:border-e" aria-label="Dashboard navigation">
      <Link href={localizedPath(locale)} className="text-sm font-semibold text-primary">
        MillionBlogs
      </Link>
      <nav className="mt-6 grid gap-2" aria-label="Dashboard sections">
        {dashboardItems.map((item) => (
          <SidebarLink key={item.href} href={item.href} currentPath={stripped}>
            {item.label}
          </SidebarLink>
        ))}
      </nav>
    </aside>
  );
}
