"use client";

import type { NotificationResponse } from "../api/notifications-api";
import { getTypeBadgeClass } from "../data/notification-types";

type NotificationDetailDialogProps = {
  notification: NotificationResponse;
  onClose: () => void;
};

export function NotificationDetailDialog({
  notification,
  onClose,
}: NotificationDetailDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-detail-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${getTypeBadgeClass(notification.type)}`}
            >
              {notification.type}
            </span>
            <h2
              id="notification-detail-title"
              className="mt-2 text-xl font-semibold text-foreground"
            >
              {notification.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted">Status:</span>
            {notification.isRead ? (
              <span className="font-medium text-success">Read</span>
            ) : (
              <span className="font-medium text-primary">Unread</span>
            )}
            {notification.isArchived && (
              <span className="font-medium text-muted">, Archived</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted">Received:</span>
            <span className="font-medium text-foreground">
              {new Date(notification.createdAt).toLocaleString()}
            </span>
          </div>
          {notification.readAt && (
            <div className="flex items-center gap-2">
              <span className="text-muted">Read at:</span>
              <span className="font-medium text-foreground">
                {new Date(notification.readAt).toLocaleString()}
              </span>
            </div>
          )}
          {notification.archivedAt && (
            <div className="flex items-center gap-2">
              <span className="text-muted">Archived at:</span>
              <span className="font-medium text-foreground">
                {new Date(notification.archivedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {notification.body && (
          <div className="mt-4 rounded-md bg-background p-4">
            <p className="text-sm leading-6 text-foreground">{notification.body}</p>
          </div>
        )}

        {notification.data && Object.keys(notification.data).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-foreground">Additional data</h3>
            <pre className="mt-2 overflow-x-auto rounded-md bg-background p-3 text-xs text-muted">
              {JSON.stringify(notification.data, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
