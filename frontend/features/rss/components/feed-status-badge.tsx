import { FEED_STATUSES, type FeedStatusConfig } from "../data/feed-status";

const variantStyles: Record<string, string> = {
  muted: "bg-muted/20 text-muted border-muted/30",
  warning: "bg-warning/10 text-warning border-warning/20",
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  promotion: "bg-promotion/10 text-promotion border-promotion/20",
};

export function FeedStatusBadge({ status }: { status: string }) {
  const config: FeedStatusConfig = FEED_STATUSES[status as keyof typeof FEED_STATUSES] ?? {
    label: status,
    variant: "muted",
  };
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${variantStyles[config.variant]}`}
    >
      {config.label}
    </span>
  );
}

export function FeedHealthBadge({ score }: { score: number }) {
  let variant: string;
  let label: string;
  if (score >= 90) {
    variant = "success";
    label = "Excellent";
  } else if (score >= 70) {
    variant = "promotion";
    label = "Good";
  } else if (score >= 50) {
    variant = "warning";
    label = "Fair";
  } else {
    variant = "danger";
    label = "Poor";
  }
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${variantStyles[variant]}`}
    >
      {label} ({score})
    </span>
  );
}
