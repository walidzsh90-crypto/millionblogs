import { apiClient } from "@/shared/api/client";

export type WalletResponse = {
  id: string;
  userId: string;
  purchasedBalance: number;
  bonusBalance: number;
  totalBalance: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type BalanceResponse = {
  totalBalance: number;
  purchasedBalance: number;
  bonusBalance: number;
};

export type TransactionType = "credit" | "debit" | "hold" | "release" | "refund" | "adjustment";

export type Transaction = {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  source: string;
  reference: string | null;
  balanceBefore: number;
  balanceAfter: number;
  actorId: string | null;
  reason: string | null;
  createdAt: string;
};

export type PaginatedTransactions = {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
};

export type TransactionFilter = {
  type?: TransactionType;
  source?: string;
  page?: number;
  pageSize?: number;
};

export const walletApi = {
  getWallet: () =>
    apiClient.request<WalletResponse>("/wallet", { method: "GET" }),

  getBalance: () =>
    apiClient.request<BalanceResponse>("/wallet/balance", { method: "GET" }),

  transactions: (filter?: TransactionFilter) => {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.type) params.set("type", filter.type);
      if (filter.source) params.set("source", filter.source);
      if (filter.page) params.set("page", String(filter.page));
      if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
    }
    const query = params.toString();
    return apiClient.request<PaginatedTransactions>(
      `/wallet/transactions${query ? `?${query}` : ""}`,
      { method: "GET" }
    );
  },
};
