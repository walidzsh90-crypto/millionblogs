import type { CampaignStatus } from "../api/promotions-api";
import { CAMPAIGN_STATUS_CONFIG } from "../data/promotions-config";

type CampaignStatusBadgeProps = {
  status: CampaignStatus;
};

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const config = CAMPAIGN_STATUS_CONFIG[status];
  const variant = config.variant;
  const borderColor =
    variant === "success"
      ? "border-success/20"
      : variant === "warning"
        ? "border-warning/20"
        : variant === "danger"
          ? "border-danger/20"
          : variant === "accent"
            ? "border-accent/20"
            : "border-muted/30";
  const textColor =
    variant === "success"
      ? "text-success"
      : variant === "warning"
        ? "text-warning"
        : variant === "danger"
          ? "text-danger"
          : variant === "accent"
            ? "text-accent"
            : "text-muted";
  const bgColor =
    variant === "success"
      ? "bg-success/10"
      : variant === "warning"
        ? "bg-warning/10"
        : variant === "danger"
          ? "bg-danger/10"
          : variant === "accent"
            ? "bg-accent/10"
            : "bg-muted/20";

  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${borderColor} ${bgColor} ${textColor}`}
    >
      {config.label}
    </span>
  );
}
