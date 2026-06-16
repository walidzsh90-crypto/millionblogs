"use client";

type CancelDialogProps = {
  planName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
};

export function CancelDialog({
  planName,
  onConfirm,
  onCancel,
  isSubmitting,
  error,
}: CancelDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <h2 id="cancel-dialog-title" className="text-xl font-semibold text-foreground">
          Cancel subscription
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Are you sure you want to cancel your <strong>{planName}</strong> subscription? You will
          lose access to premium features at the end of the current billing period.
        </p>

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
            Keep subscription
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="min-h-11 rounded-md bg-danger px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Cancelling..." : "Cancel subscription"}
          </button>
        </div>
      </div>
    </div>
  );
}
