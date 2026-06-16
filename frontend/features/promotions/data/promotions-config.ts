import type { CampaignStatus } from "../api/promotions-api";

export const CAMPAIGN_STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; variant: string }
> = {
  draft: { label: "Draft", variant: "muted" },
  active: { label: "Active", variant: "success" },
  paused: { label: "Paused", variant: "warning" },
  completed: { label: "Completed", variant: "accent" },
  cancelled: { label: "Cancelled", variant: "danger" },
  expired: { label: "Expired", variant: "danger" },
};

export const CAMPAIGN_FILTER_TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
];
