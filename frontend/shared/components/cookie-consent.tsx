"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { localizedPath } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";

type CookieConsentProps = {
  locale: Locale;
};

export function CookieConsent({ locale }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(consent);
        setPreferences(parsed);
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = (prefs: typeof preferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const acceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
    });
  };

  const rejectNonEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
    });
  };

  if (!showBanner && !showPreferences) {
    return null;
  }

  return (
    <>
      {showBanner && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-0">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" aria-hidden="true" />
          <div className="relative w-full max-w-2xl rounded-lg bg-background border border-border p-6 shadow-raised sm:w-full">
            <h2 className="text-xl font-semibold text-foreground">Cookie Consent</h2>
            <p className="mt-2 text-sm text-muted">
              We use cookies to provide essential functionality, analyze site usage, and improve your experience. You can customize your cookie preferences below.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={rejectNonEssential}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" aria-hidden="true" />
          <div className="relative w-full max-w-2xl rounded-lg bg-background border border-border p-6 shadow-raised">
            <h2 className="text-xl font-semibold text-foreground">Cookie Preferences</h2>
            <p className="mt-2 text-sm text-muted">
              Choose which cookies you want to accept. Essential cookies are required for the site to function properly.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="essential"
                  checked={preferences.essential}
                  disabled
                  className="mt-1 h-4 w-4 rounded border-border text-primary"
                />
                <div className="flex-1">
                  <label htmlFor="essential" className="text-sm font-medium text-foreground">Essential Cookies</label>
                  <p className="text-xs text-muted">Required for site functionality (login, security, etc.). Cannot be disabled.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="analytics"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-border text-primary"
                />
                <div className="flex-1">
                  <label htmlFor="analytics" className="text-sm font-medium text-foreground">Analytics Cookies</label>
                  <p className="text-xs text-muted">Help us understand how visitors use the site to improve our services.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-border text-primary"
                />
                <div className="flex-1">
                  <label htmlFor="marketing" className="text-sm font-medium text-foreground">Marketing Cookies</label>
                  <p className="text-xs text-muted">Used to deliver personalized content and ads.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveConsent(preferences)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}