"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";

type MobileNavProps = {
  locale: Locale;
  dashboardItems: Array<{ href: string; label: string; icon?: ReactNode }>;
  publicItems: Array<{ href: string; label: string }>;
  isDashboard?: boolean;
};

export function MobileNav({ locale, dashboardItems, publicItems, isDashboard = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  const items = isDashboard ? dashboardItems : publicItems;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:hidden"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeMenu} aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-background border-l border-border shadow-raised transition-transform duration-300 ease-in-out">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-lg font-semibold text-foreground">Menu</span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Close navigation menu"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-2" role="navigation" aria-label="Mobile navigation">
                <ul className="space-y-1">
                  {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <li key={item.href}>
                        <Link
                          href={localizedPath(locale, item.href)}
                          onClick={closeMenu}
                          className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {item.icon && <span className="mr-3">{item.icon}</span>}
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="border-t border-border p-4">
                <div className="text-xs text-muted">
                  MillionBlogs v1.0
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}