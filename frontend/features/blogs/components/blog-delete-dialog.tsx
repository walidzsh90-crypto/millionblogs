"use client";

import { useState } from "react";

type BlogDeleteDialogProps = {
  blogName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function BlogDeleteDialog({
  blogName,
  onConfirm,
  onCancel,
}: BlogDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err?.message ?? "Failed to delete blog");
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div
        className="mx-4 w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <h2 id="delete-dialog-title" className="text-lg font-semibold text-foreground">
          Delete blog
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Are you sure you want to delete <strong>{blogName}</strong>? This action cannot be undone.
          The blog and all associated data will be archived.
        </p>

        {error && (
          <div className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="min-h-11 rounded-md bg-danger px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="min-h-11 rounded-md border border-border px-5 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
