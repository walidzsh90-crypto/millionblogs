"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";

import { purchaseApi } from "../api/purchase-api";
import { CREDIT_PACKS } from "../data/purchase-config";
import { CreditPackCard } from "./credit-pack-card";

export function PurchaseForm() {
  const { locale: localeParam } = useParams<{ locale: string }>();
  const locale = (localeParam ?? "en") as Locale;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPack = CREDIT_PACKS.find((p) => p.planId === selectedId);

  async function handleSubmit() {
    if (!selectedId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}${localizedPath(locale, "/dashboard/purchase/success")}`;
      const cancelUrl = `${baseUrl}${localizedPath(locale, "/dashboard/purchase/cancel")}`;

      const result = await purchaseApi.createCheckout(selectedId, successUrl, cancelUrl);

      if (result.sessionUrl) {
        window.location.href = result.sessionUrl;
      } else {
        setError("Stripe checkout could not be initiated. Please try again.");
      }
    } catch (err: any) {
      const message =
        err?.message === "Network request failed"
          ? "Network error. Please check your connection and try again."
          : err?.message ?? "An unexpected error occurred. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <CreditPackCard
            key={pack.planId}
            pack={pack}
            selected={selectedId === pack.planId}
            onSelect={() => setSelectedId(pack.planId)}
          />
        ))}
      </div>

      {error ? (
        <div
          className="mt-6 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedId || isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? "Redirecting to Stripe..." : "Continue to payment"}
        </button>

        <Link
          href={localizedPath(locale, "/dashboard/wallet")}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-semibold text-foreground"
        >
          Back to wallet
        </Link>
      </div>

      {selectedPack ? (
        <p className="mt-4 text-sm text-muted">
          Selected: <span className="font-semibold text-foreground">{selectedPack.name}</span> &mdash;{" "}
          {selectedPack.credits.toLocaleString()} credits for{" "}
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: selectedPack.currency.toUpperCase(),
            minimumFractionDigits: 2,
          }).format(selectedPack.priceCents / 100)}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-muted">
        By continuing, you agree to the{" "}
        <Link href={localizedPath(locale, "/terms")} className="text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href={localizedPath(locale, "/privacy")} className="text-primary hover:underline">
          Privacy Policy
        </Link>
        . Payments are processed securely through Stripe. Your credits will be added to your wallet
        immediately after payment confirmation.
      </p>
    </div>
  );
}
