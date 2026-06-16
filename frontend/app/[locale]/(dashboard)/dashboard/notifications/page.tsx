"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  notificationsApi,
  type NotificationResponse,
  type NotificationFilter,
} from "@/features/notifications/api/notifications-api";
import { NotificationCard } from "@/features/notifications/components/notification-card";
import { NotificationFilters } from "@/features/notifications/components/notification-filters";
import { ArticlePagination } from "@/features/articles/components/article-pagination";

const PAGE_SIZE = 20;

export default function NotificationsListPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const loadRef = useRef(0);

  const load = useCallback(async () => {
    const id = ++loadRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const filter: NotificationFilter = { page, pageSize: PAGE_SIZE };
      if (activeTab === "unread") filter.unreadOnly = true;

      const [data, unreadData] = await Promise.all([
        notificationsApi.list(filter),
        notificationsApi.unreadCount(),
      ]);

      if (id !== loadRef.current) return;

      if (activeTab === "archived") {
        const archived = data.items.filter((n) => n.isArchived);
        setNotifications(archived);
        setTotal(data.total);
      } else {
        setNotifications(data.items.filter((n) => !n.isArchived));
        setTotal(data.total);
      }
      setUnreadCount(unreadData.count);
    } catch (err: any) {
      if (id === loadRef.current) {
        setError(err?.message ?? "Failed to load notifications");
      }
    } finally {
      if (id === loadRef.current) {
        setIsLoading(false);
      }
    }
  }, [page, activeTab]);

  useEffect(() => { load(); }, [load]);

  async function handleTabChange(tab: string) {
    setActiveTab(tab);
    setPage(1);
  }

  async function handleMarkRead(id: string) {
    setActionLoading(id);
    try {
      await notificationsApi.markAsRead(id);
      await load();
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllAsRead();
      await load();
    } catch {
      /* ignore */
    }
  }

  async function handleArchive(id: string) {
    setActionLoading(id);
    try {
      await notificationsApi.archive(id);
      await load();
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    try {
      await notificationsApi.deleteNotification(id);
      await load();
    } catch {
      /* ignore */
    } finally {
      setActionLoading(null);
    }
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load notifications" message={error} reset={load} />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-4xl" aria-labelledby="notifications-list-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
              Notifications
            </p>
            <h1
              id="notifications-list-title"
              className="mt-1 text-3xl font-semibold text-foreground"
            >
              Notifications
            </h1>
          </div>
          {notifications.length > 0 && activeTab !== "archived" && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="min-h-11 rounded-md border border-border px-5 text-sm font-semibold text-foreground"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="mt-6">
          <NotificationFilters
            activeTab={activeTab}
            unreadCount={unreadCount}
            onTabChange={handleTabChange}
          />
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4" aria-busy="true">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="mt-12 text-center">
            <h2 className="text-xl font-semibold text-foreground">No notifications</h2>
            <p className="mt-2 text-sm text-muted">
              {activeTab === "all"
                ? "You have no notifications yet."
                : activeTab === "unread"
                  ? "No unread notifications."
                  : "No archived notifications."}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="mt-6">
            <ArticlePagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>
    </main>
  );
}
