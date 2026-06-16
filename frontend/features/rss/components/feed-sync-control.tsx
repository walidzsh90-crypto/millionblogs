"use client";

import { useState } from "react";

import { rssApi } from "../api/rss-api";

type FeedSyncControlProps = {
  feedId: string;
  onSyncComplete?: () => void;
};

export function FeedSyncControl({ feedId, onSyncComplete }: FeedSyncControlProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSync() {
    setIsSyncing(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      const result = await rssApi.sync(feedId);
      setSyncMessage(result.message ?? "Sync triggered successfully");
      onSyncComplete?.();
    } catch (err: any) {
      setSyncError(err?.message ?? "Failed to trigger sync");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSyncing ? "Syncing..." : "Sync now"}
      </button>
      {syncMessage && (
        <p className="mt-2 text-xs text-success">{syncMessage}</p>
      )}
      {syncError && (
        <p className="mt-2 text-xs text-danger">{syncError}</p>
      )}
    </div>
  );
}
