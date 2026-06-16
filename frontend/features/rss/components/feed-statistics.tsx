import type { FeedStats } from "../api/rss-api";

type FeedStatisticsProps = {
  stats: FeedStats;
};

function StatCard({ label, value, variant }: { label: string; value: number; variant?: string }) {
  const colorClass = variant === "danger"
    ? "text-danger"
    : variant === "success"
      ? "text-success"
      : variant === "warning"
        ? "text-warning"
        : "text-foreground";

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}

export function FeedStatistics({ stats }: FeedStatisticsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <StatCard label="Total Feeds" value={stats.totalFeeds} />
      <StatCard label="Active" value={stats.activeFeeds} variant="success" />
      <StatCard label="Paused" value={stats.pausedFeeds} variant="warning" />
      <StatCard label="Failed" value={stats.failedFeeds} variant="danger" />
      <StatCard label="Disabled" value={stats.disabledFeeds} />
      <StatCard label="Archived" value={stats.archivedFeeds} />
      <StatCard label="Total Entries" value={stats.totalEntries} />
      <StatCard label="Syncs" value={stats.totalSyncs} />
      <StatCard label="Errors" value={stats.totalErrors} variant="danger" />
      <StatCard
        label="Avg Health"
        value={stats.averageHealthScore}
        variant={stats.averageHealthScore >= 70 ? "success" : stats.averageHealthScore >= 50 ? "warning" : "danger"}
      />
    </div>
  );
}
