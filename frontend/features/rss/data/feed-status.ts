import type { FeedStatus } from "../api/rss-api";

export type FeedStatusConfig = {
  label: string;
  variant: "muted" | "warning" | "success" | "danger" | "promotion";
};

export const FEED_STATUSES: Record<FeedStatus, FeedStatusConfig> = {
  active: { label: "Active", variant: "success" },
  paused: { label: "Paused", variant: "warning" },
  failed: { label: "Failed", variant: "danger" },
  disabled: { label: "Disabled", variant: "muted" },
  archived: { label: "Archived", variant: "muted" },
};

export const HEALTH_THRESHOLDS = {
  excellent: 90,
  good: 70,
  fair: 50,
} as const;
