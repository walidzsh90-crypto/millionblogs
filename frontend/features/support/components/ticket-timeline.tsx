import type { TicketResponse } from "../api/support-api";
import { TicketStatusBadge } from "./ticket-status-badge";

export type TimelineEntry = {
  type: "created" | "reply" | "status" | "closed" | "reopened";
  label: string;
  description: string;
  timestamp: string;
};

type TicketTimelineProps = {
  ticket: TicketResponse;
  replies: TimelineEntry[];
};

function TimelineIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    created: "🟢",
    reply: "💬",
    status: "🔄",
    closed: "🔴",
    reopened: "🟣",
  };
  return <span aria-hidden="true">{icons[type] ?? "📄"}</span>;
}

export function TicketTimeline({ ticket, replies }: TicketTimelineProps) {
  const entries: TimelineEntry[] = [
    {
      type: "created",
      label: "Ticket created",
      description: ticket.subject,
      timestamp: ticket.createdAt,
    },
    ...replies,
  ];

  if (ticket.closedAt) {
    entries.push({
      type: "closed",
      label: "Ticket closed",
      description: "",
      timestamp: ticket.closedAt,
    });
  }

  entries.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">History</h2>
        <p className="mt-2 text-sm text-muted">No history available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">History</h2>
      <div className="mt-4 space-y-0">
        {entries.map((entry, idx) => (
          <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-xs">
                <TimelineIcon type={entry.type} />
              </div>
              {idx < entries.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-border" />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{entry.label}</p>
                <span className="text-xs text-muted">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              {entry.description && (
                <p className="mt-1 text-sm leading-5 text-muted">{entry.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-md bg-background px-4 py-3 text-sm">
        <span className="text-muted">Current status:</span>
        <TicketStatusBadge status={ticket.status} />
      </div>
    </div>
  );
}
