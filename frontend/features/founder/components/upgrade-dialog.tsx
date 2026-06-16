"use client";

import type { FounderProgram } from "../api/founder-api";
import { formatPrice } from "../data/founder-config";

type UpgradeDialogProps = {
  currentProgram: { name: string };
  targetProgram: FounderProgram;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
};

export function UpgradeDialog({
  currentProgram,
  targetProgram,
  onConfirm,
  onCancel,
  isSubmitting,
  error,
}: UpgradeDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <h2 id="upgrade-dialog-title" className="text-xl font-semibold text-foreground">
          Upgrade to {targetProgram.name}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          You are about to upgrade from <strong>{currentProgram.name}</strong> to{" "}
          <strong>{targetProgram.name}</strong> for{" "}
          <strong>{formatPrice(targetProgram.price, targetProgram.currency)}</strong>.
        </p>

        <div className="mt-4 rounded-md bg-background p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Current program</span>
            <span className="font-medium text-foreground">{currentProgram.name}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted">Upgrade to</span>
            <span className="font-medium text-foreground">{targetProgram.name}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted">Price</span>
            <span className="font-medium text-foreground">
              {formatPrice(targetProgram.price, targetProgram.currency)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-h-11 rounded-md border border-border px-5 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="min-h-11 rounded-md bg-promotion px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Confirm upgrade"}
          </button>
        </div>
      </div>
    </div>
  );
}
