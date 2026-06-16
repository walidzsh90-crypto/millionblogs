import { apiClient } from "@/shared/api/client";

export type CampaignType = "article" | "showcase";
export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "cancelled" | "expired";

export type PromotionPackage = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  creditCost: number;
  duration: number;
  priority: number;
  status: string;
  visibility: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Campaign = {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  type: CampaignType;
  targetId: string | null;
  status: CampaignStatus;
  creditsSpent: number;
  creditsBudget: number;
  remainingCredits: number;
  weight: number;
  startDate: string | null;
  endDate: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedCampaigns = {
  items: Campaign[];
  total: number;
  page: number;
  pageSize: number;
};

export type CampaignFilter = {
  status?: CampaignStatus;
  type?: CampaignType;
  page?: number;
  pageSize?: number;
};

export type CreateCampaignInput = {
  packageId: string;
  type: CampaignType;
  targetId?: string;
  creditsBudget?: number;
  startDate?: string;
  endDate?: string;
};

export const promotionsApi = {
  packages: () =>
    apiClient.request<PromotionPackage[]>("/promotions/packages", { method: "GET" }),

  campaigns: (filter?: CampaignFilter) => {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.status) params.set("status", filter.status);
      if (filter.type) params.set("type", filter.type);
      if (filter.page) params.set("page", String(filter.page));
      if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
    }
    const query = params.toString();
    return apiClient.request<PaginatedCampaigns>(
      `/account/promotions/campaigns${query ? `?${query}` : ""}`,
      { method: "GET" }
    );
  },

  getCampaign: (id: string) =>
    apiClient.request<Campaign>(`/account/promotions/campaigns/${id}`, { method: "GET" }),

  create: (dto: CreateCampaignInput) =>
    apiClient.request<Campaign>("/account/promotions/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    }),

  activate: (id: string) =>
    apiClient.request<Campaign>(`/account/promotions/campaigns/${id}/activate`, { method: "POST" }),

  pause: (id: string) =>
    apiClient.request<Campaign>(`/account/promotions/campaigns/${id}/pause`, { method: "POST" }),

  cancel: (id: string) =>
    apiClient.request<Campaign>(`/account/promotions/campaigns/${id}/cancel`, { method: "POST" }),
};
