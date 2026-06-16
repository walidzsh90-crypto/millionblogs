export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CategoryRef = {
  id: string;
  slug: string;
  name: string;
};

export type BlogDto = {
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
  categories: CategoryRef[];
  createdAt: string;
  updatedAt: string;
};

export type ArticleDto = {
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
  status: string;
  source: string | null;
  importSource: string | null;
  viewCount: number;
  clickCount: number;
  ctr: number;
  categories: CategoryRef[];
  blog: { id: string; name: string; slug: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogStatsDto = {
  draft: number;
  pendingVerification: number;
  verified: number;
  rejected: number;
  suspended: number;
};

export type PlanDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  sortOrder: number;
  visibility: string;
  createdAt: string;
  updatedAt: string;
};

export type SearchResultDto = {
  id: string;
  type: "article" | "blog";
  title: string;
  excerpt: string | null;
  slug: string;
  url: string;
  language: string;
  publishedAt: string | null;
  rank: number;
  blogName: string | null;
  blogSlug: string | null;
  categories: string[];
};

export type SearchResponseDto = {
  results: SearchResultDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
  correctedQuery?: string;
};
