"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { localizedPath } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";

type LaunchBlockerProps = {
  locale: Locale;
  isBlocked?: boolean;
  message?: string;
  countdown?: number;
  linkText?: string;
  linkHref?: string;
};

export function LaunchBlocker({ locale, isBlocked = false, message, countdown = 30, linkText = "Try Demo", linkHref = "/" }: LaunchBlockerProps) {
  const [timeLeft, setTimeLeft] = useState(countdown);

  useEffect(() => {
    if (!isBlocked || countdown <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked, countdown]);

  if (!isBlocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg bg-background border border-border p-8 shadow-raised">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h2 className="mt-6 text-2xl font-semibold text-foreground">Launch Blocker Active</h2>
          <p className="mt-3 text-sm text-muted">
            {message || "This feature is currently blocked for maintenance. Please check back soon."}
          </p>

          {countdown > 0 && (
            <div className="mt-6">
              <div className="text-sm text-muted">Releasing in</div>
              <div className="mt-2 text-3xl font-bold text-primary">{timeLeft}s</div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={localizedPath(locale, linkHref)}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              {linkText}
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex w-full items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
            >
              Refresh Page
            </button>
          </div>

          <div className="mt-6 text-xs text-muted">
            Error ID: LB-{Date.now()}
          </div>
        </div>
      </div>
    </div>
  );
}