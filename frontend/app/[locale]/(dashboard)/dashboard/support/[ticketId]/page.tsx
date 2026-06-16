"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  supportApi,
  type TicketResponse,
} from "@/features/support/api/support-api";
import { TicketStatusBadge } from "@/features/support/components/ticket-status-badge";
import { TicketTimeline, type TimelineEntry } from "@/features/support/components/ticket-timeline";

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const localeParam = String(params.locale ?? "en");
  const ticketId = String(params.ticketId ?? "");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyBody, setReplyBody] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [timelineReplies, setTimelineReplies] = useState<TimelineEntry[]>([]);

  const load = useCallback(async () => {
    if (!ticketId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await supportApi.getById(ticketId);
      setTicket(data);
      setTimelineReplies([]);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load ticket");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || !ticket) return;
    setIsReplying(true);
    setReplyError(null);
    try {
      const reply = await supportApi.reply(ticketId, { body: replyBody.trim() });
      setTimelineReplies((prev) => [
        ...prev,
        {
          type: "reply",
          label: "You replied",
          description: reply.body,
          timestamp: reply.createdAt,
        },
      ]);
      setReplyBody("");
      const updated = await supportApi.getById(ticketId);
      setTicket(updated);
    } catch (err: any) {
      setReplyError(err?.message ?? "Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  }

  async function handleClose() {
    if (!ticket) return;
    try {
      const updated = await supportApi.close(ticketId);
      setTicket(updated);
    } catch {
      /* ignore */
    }
  }

  async function handleReopen() {
    if (!ticket) return;
    try {
      const updated = await supportApi.reopen(ticketId);
      setTicket(updated);
    } catch {
      /* ignore */
    }
  }

  const canReply = ticket && !["closed", "archived"].includes(ticket.status);
  const canClose = ticket && ticket.status !== "closed" && ticket.status !== "archived";
  const canReopen = ticket && (ticket.status === "closed" || ticket.status === "archived");

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load ticket" message={error} reset={load} />
      </main>
    );
  }

  if (isLoading || !ticket) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto w-full max-w-4xl" aria-busy="true">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-4 h-10 w-3/4" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-4xl" aria-labelledby="ticket-detail-title">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link
            href={localizedPath(locale, "/dashboard/support")}
            className="font-medium text-primary"
          >
            Support Tickets
          </Link>
          <span aria-hidden="true"> / {ticket.subject}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <TicketStatusBadge status={ticket.status} />
              {ticket.assignedTo && (
                <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
                  Assigned
                </span>
              )}
            </div>
            <h1 id="ticket-detail-title" className="mt-2 text-3xl font-semibold text-foreground">
              {ticket.subject}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canClose && (
              <button
                type="button"
                onClick={handleClose}
                className="min-h-11 rounded-md border border-danger/30 px-5 py-2.5 text-sm font-semibold text-danger"
              >
                Close ticket
              </button>
            )}
            {canReopen && (
              <button
                type="button"
                onClick={handleReopen}
                className="min-h-11 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white"
              >
                Reopen ticket
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Ticket information</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Status</dt>
                <dd>
                  <TicketStatusBadge status={ticket.status} />
                </dd>
              </div>
              {ticket.assignedTo && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Assigned to</dt>
                  <dd className="font-medium text-foreground">{ticket.assignedTo}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Replies</dt>
                <dd className="font-medium text-foreground">{ticket.replyCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Created</dt>
                <dd className="font-medium text-foreground">
                  {new Date(ticket.createdAt).toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Updated</dt>
                <dd className="font-medium text-foreground">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </dd>
              </div>
              {ticket.closedAt && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Closed</dt>
                  <dd className="font-medium text-foreground">
                    {new Date(ticket.closedAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <TicketTimeline ticket={ticket} replies={timelineReplies} />
        </div>

        {ticket.body && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{ticket.body}</p>
          </div>
        )}

        {canReply && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Add a reply</h2>
            <form onSubmit={handleReply} className="mt-4 grid gap-4">
              {replyError && (
                <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {replyError}
                </div>
              )}
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                className="min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
                placeholder="Type your reply..."
                rows={4}
                aria-label="Reply body"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isReplying || !replyBody.trim()}
                  className="min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isReplying ? "Sending..." : "Send reply"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
