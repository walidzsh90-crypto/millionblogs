export class SearchResultDto {
  id: string;
  type: 'article' | 'blog';
  title: string;
  excerpt: string | null;
  slug: string;
  url: string;
  language: string;
  publishedAt: Date | null;
  rank: number;
  blogName: string | null;
  blogSlug: string | null;
  categories: string[];

  static fromArticle(article: any, rank: number): SearchResultDto {
    return {
      id: article.id,
      type: 'article',
      title: article.title,
      excerpt: article.excerpt?.substring(0, 300) || null,
      slug: article.slug,
      url: `/article/${article.blog?.slug || article.blogId}/${article.slug}`,
      language: article.language,
      publishedAt: article.publishedAt,
      rank,
      blogName: article.blog?.name || null,
      blogSlug: article.blog?.slug || null,
      categories: article.categories?.map((ac: any) => ac.category?.name).filter(Boolean) || [],
    };
  }

  static fromBlog(blog: any, rank: number): SearchResultDto {
    return {
      id: blog.id,
      type: 'blog',
      title: blog.name,
      excerpt: blog.description?.substring(0, 300) || null,
      slug: blog.slug,
      url: `/blog/${blog.slug}`,
      language: blog.primaryLanguage,
      publishedAt: blog.createdAt,
      rank,
      blogName: blog.name,
      blogSlug: blog.slug,
      categories: blog.categories?.map((bc: any) => bc.category?.name).filter(Boolean) || [],
    };
  }
}

export class SearchResponseDto {
  results: SearchResultDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
  correctedQuery?: string;
}
