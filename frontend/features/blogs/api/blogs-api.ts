import { apiClient } from "@/shared/api/client";

export type BlogResponse = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  faviconUrl: string | null;
  primaryLanguage: string;
  additionalLanguages: string[];
  status: string;
  trustStatus: string;
  verifiedAt: string | null;
  visibility: string;
  categories: Array<{ id: string; slug: string; name: string }>;
  createdAt: string;
  updatedAt: string;
};

export type CreateBlogInput = {
  name: string;
  url: string;
  description?: string;
  primaryLanguage: string;
  categoryIds?: string[];
  additionalLanguages?: string[];
};

export type UpdateBlogInput = {
  name?: string;
  description?: string;
  url?: string;
  primaryLanguage?: string;
  visibility?: string;
  categoryIds?: string[];
  additionalLanguages?: string[];
};

export type BlogFilter = {
  search?: string;
  status?: string;
  trustStatus?: string;
  language?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
};

export const blogsApi = {
  list: (filter?: BlogFilter) =>
    apiClient.request<PaginatedResult<BlogResponse>>("/blogs", {
      method: "GET",
      ...(filter ? { body: undefined } : {}),
    }),

  myBlogs: () =>
    apiClient.request<BlogResponse[]>("/blogs/my", { method: "GET" }),

  getBySlug: (slug: string) =>
    apiClient.request<BlogResponse>(`/blogs/${slug}`, { method: "GET" }),

  getById: (id: string) =>
    apiClient.request<BlogResponse>(`/blogs/${id}`, { method: "GET" }),

  create: (input: CreateBlogInput) =>
    apiClient.request<BlogResponse>("/blogs", {
      method: "POST",
      body: input,
    }),

  update: (id: string, input: UpdateBlogInput) =>
    apiClient.request<BlogResponse>(`/blogs/${id}`, {
      method: "PATCH",
      body: input,
    }),

  remove: (id: string) =>
    apiClient.request<void>(`/blogs/${id}`, { method: "DELETE" }),

  categories: {
    list: () =>
      apiClient.request<Category[]>("/categories", { method: "GET" }),
  },
};
