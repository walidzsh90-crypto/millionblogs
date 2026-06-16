"use client";

type FeedDeleteDialogProps = {
  feedName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function FeedDeleteDialog({ feedName, onConfirm, onCancel }: FeedDeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <h2 id="delete-dialog-title" className="text-xl font-semibold text-foreground">
          Remove feed
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Are you sure you want to remove <strong>{feedName}</strong>? This action cannot be
          undone.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-md border border-border px-5 text-sm font-semibold text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-md bg-danger px-5 text-sm font-semibold text-white"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
