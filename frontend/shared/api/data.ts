import { ssrFetch, buildQueryString } from "./ssr";
import type { BlogDto, ArticleDto, BlogStatsDto, PlanDto, PaginatedResult, CategoryRef, SearchResponseDto } from "./types";

export async function fetchBlogs(params?: {
  search?: string;
  language?: string;
  categorySlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<BlogDto> | null> {
  const qs = buildQueryString({
    search: params?.search,
    language: params?.language,
    categorySlug: params?.categorySlug,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
  });
  return ssrFetch<PaginatedResult<BlogDto>>(`/blogs${qs}`);
}

export async function fetchArticles(params?: {
  search?: string;
  language?: string;
  categorySlug?: string;
  blogId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<ArticleDto> | null> {
  const qs = buildQueryString({
    search: params?.search,
    language: params?.language,
    categorySlug: params?.categorySlug,
    blogId: params?.blogId,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
  });
  return ssrFetch<PaginatedResult<ArticleDto>>(`/articles${qs}`);
}

export async function fetchBlogStats(): Promise<BlogStatsDto | null> {
  return ssrFetch<BlogStatsDto>("/blogs/stats");
}

export async function fetchPlans(): Promise<PlanDto[] | null> {
  return ssrFetch<PlanDto[]>("/plans");
}

export async function extractCategories(blogs: BlogDto[] | null): Promise<CategoryRef[]> {
  if (!blogs) return [];
  const seen = new Map<string, CategoryRef>();
  for (const blog of blogs) {
    for (const cat of blog.categories) {
      if (!seen.has(cat.slug)) {
        seen.set(cat.slug, cat);
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function extractLanguages(articles: ArticleDto[] | null): Promise<string[]> {
  if (!articles) return [];
  const seen = new Set<string>();
  for (const a of articles) {
    if (a.language) seen.add(a.language);
  }
  return Array.from(seen).sort();
}

export async function fetchSearch(params: {
  q: string;
  language?: string;
  categorySlug?: string;
  blogSlug?: string;
  page?: number;
  pageSize?: number;
}): Promise<SearchResponseDto | null> {
  const qs = buildQueryString({
    q: params.q,
    language: params.language,
    categorySlug: params.categorySlug,
    blogSlug: params.blogSlug,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  });
  return ssrFetch<SearchResponseDto>(`/search${qs}`);
}

export async function fetchBlogBySlug(slug: string): Promise<BlogDto | null> {
  return ssrFetch<BlogDto>(`/blogs/${encodeURIComponent(slug)}`);
}

export async function fetchArticleById(id: string): Promise<ArticleDto | null> {
  return ssrFetch<ArticleDto>(`/articles/${encodeURIComponent(id)}`);
}
