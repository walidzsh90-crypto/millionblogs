import { apiClient } from "@/shared/api/client";

export type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  visibility: string;
  features: Record<string, unknown> | null;
  limits: Record<string, unknown> | null;
  status: string;
  sortOrder: number;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionStatus = "pending" | "active" | "grace_period" | "expired" | "cancelled" | "suspended";

export type Subscription = {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planSlug: string;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  renewalDate: string | null;
  expirationDate: string | null;
  gracePeriodEnd: string | null;
  cancelledAt: string | null;
  nextBillingDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  userId: string;
  planId: string | null;
  amount: number;
  currency: string;
  status: string;
  stripePaymentId: string | null;
  stripeSessionId: string | null;
  creditsPurchased: number | null;
  completedAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedPayments = {
  items: Payment[];
  total: number;
  page: number;
  pageSize: number;
};

export const subscriptionsApi = {
  plans: () =>
    apiClient.request<Plan[]>("/plans", { method: "GET" }),

  planBySlug: (slug: string) =>
    apiClient.request<Plan>(`/plans/${slug}`, { method: "GET" }),

  list: () =>
    apiClient.request<Subscription[]>("/subscriptions", { method: "GET" }),

  active: () =>
    apiClient.request<Subscription | null>("/subscriptions/active", { method: "GET" }),

  getById: (id: string) =>
    apiClient.request<Subscription>(`/subscriptions/${id}`, { method: "GET" }),

  create: (planId: string) =>
    apiClient.request<Subscription>("/subscriptions", {
      method: "POST",
      body: { planId },
    }),

  cancel: (id: string) =>
    apiClient.request<Subscription>(`/subscriptions/${id}/cancel`, {
      method: "POST",
    }),

  payments: (page = 1, pageSize = 20) =>
    apiClient.request<PaginatedPayments>(
      `/payments?page=${page}&pageSize=${pageSize}`,
      { method: "GET" }
    ),
};
