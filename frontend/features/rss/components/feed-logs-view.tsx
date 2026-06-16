import type { FeedLog } from "../api/rss-api";

type FeedLogsViewProps = {
  logs: FeedLog[];
  isLoading: boolean;
};

function getStatusColor(status: string) {
  switch (status) {
    case "success":
      return "text-success";
    case "failed":
    case "error":
      return "text-danger";
    case "skipped":
      return "text-muted";
    default:
      return "text-foreground";
  }
}

export function FeedLogsView({ logs, isLoading }: FeedLogsViewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-md bg-muted/20"
          />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">No sync logs yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted">
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Duration</th>
            <th className="px-3 py-3">Status Code</th>
            <th className="px-3 py-3">Imported</th>
            <th className="px-3 py-3">Skipped</th>
            <th className="px-3 py-3">Duplicates</th>
            <th className="px-3 py-3">Error</th>
            <th className="px-3 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-border/50 text-foreground">
              <td className={`px-3 py-3 font-medium ${getStatusColor(log.status)}`}>
                {log.status}
              </td>
              <td className="px-3 py-3">
                {log.durationMs != null ? `${log.durationMs}ms` : "-"}
              </td>
              <td className="px-3 py-3">
                {log.statusCode ?? "-"}
              </td>
              <td className="px-3 py-3">{log.importedCount}</td>
              <td className="px-3 py-3">{log.skippedCount}</td>
              <td className="px-3 py-3">{log.duplicateCount}</td>
              <td className="max-w-[200px] truncate px-3 py-3 text-danger">
                {log.error ?? "-"}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-muted">
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
