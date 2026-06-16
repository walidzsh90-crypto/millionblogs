import { apiClient } from "@/shared/api/client";

export type CheckoutSessionResponse = {
  sessionId: string;
  sessionUrl: string | null;
  paymentId: string;
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

export const purchaseApi = {
  createCheckout: (planId: string, successUrl?: string, cancelUrl?: string) =>
    apiClient.request<CheckoutSessionResponse>("/payments/checkout", {
      method: "POST",
      body: { planId, successUrl, cancelUrl },
    }),

  listPayments: (params?: { status?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    const query = searchParams.toString();
    return apiClient.request<PaginatedPayments>(
      `/payments${query ? `?${query}` : ""}`,
      { method: "GET" }
    );
  },

  getPayment: (id: string) =>
    apiClient.request<Payment>(`/payments/${id}`, { method: "GET" }),
};
