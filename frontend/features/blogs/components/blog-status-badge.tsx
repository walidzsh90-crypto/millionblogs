import { BLOG_STATUSES, TRUST_STATUSES, type BlogStatus, type TrustStatus } from "../data/blog-status";

type BadgeVariant = "muted" | "warning" | "success" | "danger" | "promotion";

const variantStyles: Record<BadgeVariant, string> = {
  muted: "bg-muted/20 text-muted border-muted/30",
  warning: "bg-warning/10 text-warning border-warning/20",
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  promotion: "bg-promotion/10 text-promotion border-promotion/20",
};

export function BlogStatusBadge({ status }: { status: string }) {
  const config = BLOG_STATUSES[status as BlogStatus] ?? {
    label: status,
    variant: "muted" as const,
  };
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${variantStyles[config.variant]}`}
    >
      {config.label}
    </span>
  );
}

export function TrustStatusBadge({ trustStatus }: { trustStatus: string }) {
  const config = TRUST_STATUSES[trustStatus as TrustStatus] ?? {
    label: trustStatus,
    variant: "muted" as const,
  };
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${variantStyles[config.variant]}`}
    >
      {config.label}
    </span>
  );
}

export function VisibilityBadge({ visibility }: { visibility: string }) {
  const isPublic = visibility === "public";
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${isPublic ? "bg-success/10 text-success border-success/20" : "bg-muted/20 text-muted border-muted/30"}`}
    >
      {isPublic ? "Public" : "Unlisted"}
    </span>
  );
}
