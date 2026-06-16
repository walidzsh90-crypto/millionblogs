import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

import type { TicketResponse } from "../api/support-api";
import { TicketStatusBadge } from "./ticket-status-badge";

type TicketCardProps = {
  ticket: TicketResponse;
  locale: Locale;
};

export function TicketCard({ ticket, locale }: TicketCardProps) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            {ticket.assignedTo && (
              <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
                Assigned
              </span>
            )}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-foreground">
            <Link
              href={localizedPath(locale, `/dashboard/support/${ticket.id}`)}
              className="hover:text-primary"
            >
              {ticket.subject}
            </Link>
          </h3>
          {ticket.body && (
            <p className="mt-1 text-sm leading-6 text-muted line-clamp-2">{ticket.body}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted">
        <span>{ticket.replyCount} {ticket.replyCount === 1 ? "reply" : "replies"}</span>
        <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
        {ticket.closedAt && <span>Closed {new Date(ticket.closedAt).toLocaleDateString()}</span>}
      </div>

      <div className="mt-3">
        <Link
          href={localizedPath(locale, `/dashboard/support/${ticket.id}`)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          View ticket
        </Link>
      </div>
    </article>
  );
}
