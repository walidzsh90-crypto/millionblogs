import { apiClient } from "@/shared/api/client";

export type FeedStatus = "active" | "paused" | "failed" | "disabled" | "archived";
export type FeedType = "rss" | "atom" | "json";

export type FeedEntry = {
  id: string;
  feedId: string;
  guid: string;
  canonicalUrl: string | null;
  normalizedUrl: string | null;
  urlHash: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  author: string | null;
  categories: string[] | null;
  language: string | null;
  publishedAt: string | null;
  discoveredAt: string;
};

export type FeedLog = {
  id: string;
  feedId: string;
  status: string;
  requestTime: string | null;
  responseTime: string | null;
  durationMs: number | null;
  statusCode: number | null;
  error: string | null;
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type FeedResponse = {
  id: string;
  blogId: string;
  url: string;
  title: string | null;
  description: string | null;
  siteUrl: string | null;
  feedType: string | null;
  language: string | null;
  icon: string | null;
  status: FeedStatus;
  syncFrequency: number;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  successCount: number;
  failureCount: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  averageResponseTime: number | null;
  healthScore: number;
  lastError: string | null;
  errorCount: number;
  priority: number;
  entryCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedFeeds = {
  items: FeedResponse[];
  total: number;
  page: number;
  pageSize: number;
};

export type FeedStats = {
  totalFeeds: number;
  activeFeeds: number;
  pausedFeeds: number;
  failedFeeds: number;
  disabledFeeds: number;
  archivedFeeds: number;
  totalEntries: number;
  totalSyncs: number;
  totalErrors: number;
  averageHealthScore: number;
};

export type FeedFilter = {
  search?: string;
  status?: FeedStatus;
  blogId?: string;
  feedType?: FeedType;
  page?: number;
  pageSize?: number;
};

export type AddFeedInput = {
  url: string;
  blogId?: string;
  syncFrequency?: number;
};

export type UpdateFeedInput = {
  url?: string;
  title?: string;
  description?: string;
  syncFrequency?: number;
};

export type SchedulerStatus = {
  running: boolean;
  pendingQueue: number;
  retryQueue: number;
  deadLetterQueue: number;
};

export type FeedHealth = {
  feedId: string;
  healthScore: number;
  successRate: number;
  averageResponseTime: number | null;
  lastSyncAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
};

export type SyncFrequencies = Record<string, number>;

export const rssApi = {
  list: (filter?: FeedFilter) => {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.search) params.set("search", filter.search);
      if (filter.status) params.set("status", filter.status);
      if (filter.blogId) params.set("blogId", filter.blogId);
      if (filter.feedType) params.set("feedType", filter.feedType);
      if (filter.page) params.set("page", String(filter.page));
      if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
    }
    const query = params.toString();
    return apiClient.request<PaginatedFeeds>(`/feeds${query ? `?${query}` : ""}`, { method: "GET" });
  },

  getById: (id: string) =>
    apiClient.request<FeedResponse>(`/feeds/${id}`, { method: "GET" }),

  getByBlog: (blogId: string) =>
    apiClient.request<FeedResponse[]>(`/feeds/blog/${blogId}`, { method: "GET" }),

  create: (input: AddFeedInput, blogId?: string) => {
    const query = blogId ? `?blogId=${encodeURIComponent(blogId)}` : "";
    return apiClient.request<FeedResponse>(`/feeds${query}`, {
      method: "POST",
      body: input,
    });
  },

  update: (id: string, input: UpdateFeedInput) =>
    apiClient.request<FeedResponse>(`/feeds/${id}`, {
      method: "PATCH",
      body: input,
    }),

  remove: (id: string) =>
    apiClient.request<void>(`/feeds/${id}`, { method: "DELETE" }),

  sync: (id: string) =>
    apiClient.request<{ message: string }>(`/feeds/${id}/sync`, { method: "POST" }),

  pause: (id: string) =>
    apiClient.request<FeedResponse>(`/feeds/${id}/pause`, { method: "POST" }),

  enable: (id: string) =>
    apiClient.request<FeedResponse>(`/feeds/${id}/enable`, { method: "POST" }),

  disable: (id: string) =>
    apiClient.request<FeedResponse>(`/feeds/${id}/disable`, { method: "POST" }),

  stats: () =>
    apiClient.request<FeedStats>("/feeds/stats", { method: "GET" }),

  scheduler: () =>
    apiClient.request<SchedulerStatus>("/feeds/scheduler", { method: "GET" }),

  frequencies: () =>
    apiClient.request<SyncFrequencies>("/feeds/frequencies", { method: "GET" }),

  entries: (id: string, limit = 50) =>
    apiClient.request<FeedEntry[]>(`/feeds/${id}/entries?limit=${limit}`, { method: "GET" }),

  logs: (id: string, limit = 50) =>
    apiClient.request<FeedLog[]>(`/feeds/${id}/logs?limit=${limit}`, { method: "GET" }),

  health: (id: string) =>
    apiClient.request<FeedHealth>(`/feeds/${id}/health`, { method: "GET" }),
};
