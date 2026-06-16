import { apiClient } from "@/shared/api/client";

export type NotificationType = "system" | "promotion" | "wallet" | "subscription" | "badge" | "support";

export type NotificationResponse = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  isArchived: boolean;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
};

export type PaginatedNotifications = {
  items: NotificationResponse[];
  total: number;
  page: number;
  pageSize: number;
};

export type UnreadCountResponse = {
  count: number;
};

export type MarkAllReadResponse = {
  count: number;
};

export type DeleteResponse = {
  deleted: boolean;
};

export type NotificationFilter = {
  type?: NotificationType;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
};

export const notificationsApi = {
  list: (filter?: NotificationFilter) => {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.type) params.set("type", filter.type);
      if (filter.unreadOnly) params.set("unreadOnly", "true");
      if (filter.page) params.set("page", String(filter.page));
      if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
    }
    const query = params.toString();
    return apiClient.request<PaginatedNotifications>(
      `/account/notifications${query ? `?${query}` : ""}`,
      { method: "GET" }
    );
  },

  unreadCount: () =>
    apiClient.request<UnreadCountResponse>("/account/notifications/unread-count", {
      method: "GET",
    }),

  markAsRead: (id: string) =>
    apiClient.request<NotificationResponse>(`/account/notifications/${id}/read`, {
      method: "POST",
    }),

  markAllAsRead: () =>
    apiClient.request<MarkAllReadResponse>("/account/notifications/mark-all-read", {
      method: "POST",
    }),

  archive: (id: string) =>
    apiClient.request<NotificationResponse>(`/account/notifications/${id}/archive`, {
      method: "POST",
    }),

  deleteNotification: (id: string) =>
    apiClient.request<DeleteResponse>(`/account/notifications/${id}`, {
      method: "DELETE",
    }),
};
