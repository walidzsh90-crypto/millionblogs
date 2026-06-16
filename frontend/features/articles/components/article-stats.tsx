import type { ArticleStatus } from "../api/articles-api";

type ArticleStatsProps = {
  total: number;
  statusCounts: Record<string, number>;
};

export function ArticleStats({ total, statusCounts }: ArticleStatsProps) {
  const statColor: Record<string, string> = {
    draft: "text-muted",
    processing: "text-warning",
    published: "text-success",
    rejected: "text-danger",
    archived: "text-muted",
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{total}</p>
      </div>
      {Object.entries(statusCounts).map(([status, count]) => (
        <div key={status} className="rounded-lg border border-border bg-surface p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{status}</p>
          <p className={`mt-1 text-2xl font-semibold ${statColor[status] ?? "text-foreground"}`}>
            {count}
          </p>
        </div>
      ))}
    </div>
  );
}
