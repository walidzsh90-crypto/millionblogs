import { ARTICLE_STATUSES, type ArticleStatusConfig } from "../data/article-status";

const variantStyles: Record<string, string> = {
  muted: "bg-muted/20 text-muted border-muted/30",
  warning: "bg-warning/10 text-warning border-warning/20",
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  promotion: "bg-promotion/10 text-promotion border-promotion/20",
};

export function ArticleStatusBadge({ status }: { status: string }) {
  const config: ArticleStatusConfig =
    ARTICLE_STATUSES[status as keyof typeof ARTICLE_STATUSES] ?? {
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

export function DuplicateBadge({ isDuplicate }: { isDuplicate: boolean }) {
  if (!isDuplicate) return null;
  return (
    <span className="inline-block rounded-sm border border-warning/20 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
      Duplicate
    </span>
  );
}
