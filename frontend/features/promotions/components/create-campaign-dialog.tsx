import { useState, type FormEvent } from "react";

import type { PromotionPackage, CampaignType, CreateCampaignInput } from "../api/promotions-api";

type CreateCampaignDialogProps = {
  pkg: PromotionPackage;
  walletBalance: number;
  onSubmit: (input: CreateCampaignInput) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
  error: string | null;
};

export function CreateCampaignDialog({
  pkg,
  walletBalance,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}: CreateCampaignDialogProps) {
  const [type, setType] = useState<CampaignType>("article");
  const [creditsBudget, setCreditsBudget] = useState(pkg.creditCost);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const hasSufficientBalance = walletBalance >= creditsBudget;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hasSufficientBalance || creditsBudget < pkg.creditCost) return;
    onSubmit({
      packageId: pkg.id,
      type,
      creditsBudget,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-campaign-title"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 id="create-campaign-title" className="text-xl font-semibold text-foreground">
            New campaign
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md p-1 text-muted hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-sm text-muted">
          Package: <strong className="text-foreground">{pkg.name}</strong> ({pkg.creditCost} credits minimum)
        </p>
        <p className="mt-1 text-xs text-muted">
          Wallet balance: <strong className={hasSufficientBalance ? "text-success" : "text-danger"}>{walletBalance}</strong> credits
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="campaign-type" className="block text-sm font-semibold text-foreground">
              Type
            </label>
            <select
              id="campaign-type"
              value={type}
              onChange={(e) => setType(e.target.value as CampaignType)}
              className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="article">Article promotion</option>
              <option value="showcase">Showcase</option>
            </select>
          </div>

          <div>
            <label htmlFor="credits-budget" className="block text-sm font-semibold text-foreground">
              Credit budget (min {pkg.creditCost})
            </label>
            <input
              id="credits-budget"
              type="number"
              min={pkg.creditCost}
              value={creditsBudget}
              onChange={(e) => setCreditsBudget(Number(e.target.value))}
              className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
            />
            {creditsBudget < pkg.creditCost && (
              <p className="mt-1 text-xs text-danger">Budget must be at least {pkg.creditCost} credits</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="start-date" className="block text-sm font-semibold text-foreground">
                Start date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-semibold text-foreground">
                End date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-11 rounded-md border border-border px-5 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasSufficientBalance || creditsBudget < pkg.creditCost}
              className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : `Create (${creditsBudget} credits)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
