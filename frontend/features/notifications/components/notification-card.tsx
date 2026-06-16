"use client";

import { useState } from "react";

import type { NotificationResponse } from "../api/notifications-api";
import { getTypeBadgeClass } from "../data/notification-types";
import { NotificationDetailDialog } from "./notification-detail-dialog";

type NotificationCardProps = {
  notification: NotificationResponse;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
};

export function NotificationCard({
  notification,
  onMarkRead,
  onArchive,
  onDelete,
}: NotificationCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <article
        className={`rounded-lg border p-4 transition-colors ${
          notification.isRead
            ? "border-border bg-surface"
            : "border-primary/20 bg-primary/5"
        }`}
        aria-label={`Notification: ${notification.title}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
              )}
              <span
                className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${getTypeBadgeClass(notification.type)}`}
              >
                {notification.type}
              </span>
              {notification.isArchived && (
                <span className="text-xs text-muted">Archived</span>
              )}
            </div>
            <h3
              className={`mt-1 text-sm ${notification.isRead ? "font-medium text-foreground" : "font-semibold text-foreground"}`}
            >
              {notification.title}
            </h3>
            {notification.body && (
              <p className="mt-1 text-sm leading-5 text-muted line-clamp-2">
                {notification.body}
              </p>
            )}
            <p className="mt-2 text-xs text-muted">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-1">
            {!notification.isRead && (
              <button
                type="button"
                onClick={() => onMarkRead(notification.id)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/20"
                aria-label="Mark as read"
              >
                Read
              </button>
            )}
            {!notification.isArchived && (
              <button
                type="button"
                onClick={() => onArchive(notification.id)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-muted/20"
                aria-label="Archive"
              >
                Archive
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(notification.id)}
              className="rounded-md border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
              aria-label="Delete"
            >
              Delete
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          View details
        </button>
      </article>

      {showDetail && (
        <NotificationDetailDialog
          notification={notification}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}
