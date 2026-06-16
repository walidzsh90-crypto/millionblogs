"use client";

import { useState, type FormEvent } from "react";

import type { FeedResponse, AddFeedInput, UpdateFeedInput } from "../api/rss-api";
import { SYNC_FREQUENCIES, getSyncFrequencyLabel } from "../data/sync-frequencies";

type FeedFormProps = {
  mode: "create" | "edit";
  feed?: FeedResponse;
  frequencies: Record<string, number>;
  onSubmit: (data: AddFeedInput | UpdateFeedInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
};

export function FeedForm({
  mode,
  feed,
  frequencies,
  onSubmit,
  onCancel,
  isSubmitting,
}: FeedFormProps) {
  const [url, setUrl] = useState(feed?.url ?? "");
  const [title, setTitle] = useState(feed?.title ?? "");
  const [description, setDescription] = useState(feed?.description ?? "");
  const [syncFrequency, setSyncFrequency] = useState<number>(
    feed?.syncFrequency ?? (frequencies.ONE_HOUR ?? 3600)
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!url.trim()) {
      newErrors.url = "Feed URL is required";
    } else if (!/^https?:\/\/.+/i.test(url.trim())) {
      newErrors.url = "URL must start with http:// or https://";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    try {
      const payload: Record<string, unknown> = {
        url: url.trim(),
        syncFrequency,
      };
      if (mode === "edit") {
        if (title.trim()) payload.title = title.trim();
        if (description.trim()) payload.description = description.trim();
      }
      await onSubmit(payload as AddFeedInput | UpdateFeedInput);
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed to save feed");
    }
  }

  const freqOptions = Object.entries(frequencies).map(([key, value]) => ({
    key,
    value,
    label: getSyncFrequencyLabel(value),
  }));

  return (
    <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
      {submitError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {submitError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="feed-url" className="text-sm font-semibold text-foreground">
          Feed URL <span className="text-danger">*</span>
        </label>
        <input
          id="feed-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={`min-h-11 rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted ${errors.url ? "border-danger" : "border-border"}`}
          placeholder="https://example.com/feed.xml"
          aria-invalid={!!errors.url}
          aria-describedby={errors.url ? "feed-url-error" : undefined}
        />
        {errors.url && (
          <p id="feed-url-error" className="text-xs text-danger">
            {errors.url}
          </p>
        )}
      </div>

      {mode === "edit" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="feed-title" className="text-sm font-semibold text-foreground">
              Title
            </label>
            <input
              id="feed-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted"
              placeholder="Feed title"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="feed-description" className="text-sm font-semibold text-foreground">
              Description
            </label>
            <textarea
              id="feed-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
              placeholder="Feed description"
              rows={4}
            />
          </div>
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="feed-frequency" className="text-sm font-semibold text-foreground">
          Sync frequency
        </label>
        <select
          id="feed-frequency"
          value={syncFrequency}
          onChange={(e) => setSyncFrequency(Number(e.target.value))}
          className="min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        >
          {freqOptions.map((opt) => (
            <option key={opt.key} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Add feed"
              : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-11 rounded-md border border-border px-6 text-sm font-semibold text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
