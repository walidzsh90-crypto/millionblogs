import { apiClient } from "@/shared/api/client";

export type TicketStatus = "open" | "pending" | "answered" | "closed" | "archived";

export type TicketReply = {
  id: string;
  ticketId: string;
  userId: string;
  body: string;
  createdAt: string;
};

export type TicketResponse = {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  body: string | null;
  status: TicketStatus;
  assignedTo: string | null;
  replyCount: number;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedTickets = {
  items: TicketResponse[];
  total: number;
  page: number;
  pageSize: number;
};

export type TicketFilter = {
  status?: TicketStatus;
  page?: number;
  pageSize?: number;
};

export type CreateTicketInput = {
  subject: string;
  body?: string;
};

export type ReplyInput = {
  body: string;
};

export const supportApi = {
  list: (filter?: TicketFilter) => {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.status) params.set("status", filter.status);
      if (filter.page) params.set("page", String(filter.page));
      if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
    }
    const query = params.toString();
    return apiClient.request<PaginatedTickets>(
      `/account/support/tickets${query ? `?${query}` : ""}`,
      { method: "GET" }
    );
  },

  getById: (id: string) =>
    apiClient.request<TicketResponse>(`/account/support/tickets/${id}`, { method: "GET" }),

  create: (input: CreateTicketInput) =>
    apiClient.request<TicketResponse>("/account/support/tickets", {
      method: "POST",
      body: input,
    }),

  reply: (ticketId: string, input: ReplyInput) =>
    apiClient.request<TicketReply>(`/account/support/tickets/${ticketId}/reply`, {
      method: "POST",
      body: input,
    }),

  close: (ticketId: string) =>
    apiClient.request<TicketResponse>(`/account/support/tickets/${ticketId}/close`, {
      method: "POST",
    }),

  reopen: (ticketId: string) =>
    apiClient.request<TicketResponse>(`/account/support/tickets/${ticketId}/reopen`, {
      method: "POST",
    }),
};
