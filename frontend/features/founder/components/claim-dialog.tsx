"use client";

import type { FounderProgram } from "../api/founder-api";
import { formatPrice } from "../data/founder-config";

type ClaimDialogProps = {
  program: FounderProgram;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
};

export function ClaimDialog({
  program,
  onConfirm,
  onCancel,
  isSubmitting,
  error,
}: ClaimDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <h2 id="claim-dialog-title" className="text-xl font-semibold text-foreground">
          Claim {program.name}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          You are about to claim a Founder seat in the{" "}
          <strong>{program.name}</strong> program for{" "}
          <strong>{formatPrice(program.price, program.currency)}</strong>.
        </p>

        <div className="mt-4 rounded-md bg-background p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Program</span>
            <span className="font-medium text-foreground">{program.name}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted">Price</span>
            <span className="font-medium text-foreground">
              {formatPrice(program.price, program.currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted">Available seats</span>
            <span className="font-medium text-foreground">{program.remainingSeats}</span>
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
            className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Confirm & Claim"}
          </button>
        </div>
      </div>
    </div>
  );
}
