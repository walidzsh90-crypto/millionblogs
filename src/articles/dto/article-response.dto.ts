export class ArticleResponseDto {
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
  publishedAt: Date | null;
  status: string;
  source: string | null;
  importSource: string | null;
  viewCount: number;
  clickCount: number;
  ctr: number;
  categories: Array<{ id: string; slug: string; name: string }>;
  blog: { id: string; name: string; slug: string } | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(article: any): ArticleResponseDto {
    const categories = article.categories?.map((ac: any) => ({
      id: ac.category.id,
      slug: ac.category.slug,
      name: ac.category.name,
    })) || [];

    return {
      id: article.id,
      blogId: article.blogId,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      canonicalUrl: article.canonicalUrl,
      featuredImageUrl: article.featuredImageUrl,
      author: article.author,
      language: article.language,
      languageConfidence: article.languageConfidence,
      publishedAt: article.publishedAt,
      status: article.status,
      source: article.source,
      importSource: article.importSource,
      viewCount: article.viewCount,
      clickCount: article.clickCount,
      ctr: article.ctr,
      categories,
      blog: article.blog
        ? { id: article.blog.id, name: article.blog.name, slug: article.blog.slug }
        : null,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }
}
