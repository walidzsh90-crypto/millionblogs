import { apiClient } from "@/shared/api/client";

export type ArticleStatus = "draft" | "processing" | "published" | "rejected" | "archived";

export type ArticleCategory = {
  id: string;
  slug: string;
  name: string;
};

export type ArticleBlogRef = {
  id: string;
  name: string;
  slug: string;
};

export type ArticleResponse = {
  id: string;
  blogId: string;
  slug: string;
  title: string;
  excerpt: string | null;
  canonicalUrl: string;
  featuredImageUrl: string | null;
  author: string | null;
  language: string;
  languageConfidence: number | null;
  publishedAt: string | null;
  status: ArticleStatus;
  source: string | null;
  importSource: string | null;
  viewCount: number;
  clickCount: number;
  ctr: number;
  categories: ArticleCategory[];
  blog: ArticleBlogRef | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedArticles = {
  items: ArticleResponse[];
  total: number;
  page: number;
  pageSize: number;
};

export type ArticleFilter = {
  search?: string;
  status?: ArticleStatus;
  language?: string;
  blogId?: string;
  categorySlug?: string;
  page?: number;
  pageSize?: number;
};

export const articlesApi = {
  list: (filter?: ArticleFilter) => {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.search) params.set("search", filter.search);
      if (filter.status) params.set("status", filter.status);
      if (filter.language) params.set("language", filter.language);
      if (filter.blogId) params.set("blogId", filter.blogId);
      if (filter.categorySlug) params.set("categorySlug", filter.categorySlug);
      if (filter.page) params.set("page", String(filter.page));
      if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
    }
    const query = params.toString();
    return apiClient.request<PaginatedArticles>(
      `/user/articles${query ? `?${query}` : ""}`,
      { method: "GET" }
    );
  },

  getById: (id: string) =>
    apiClient.request<ArticleResponse>(`/user/articles/${id}`, { method: "GET" }),
};
