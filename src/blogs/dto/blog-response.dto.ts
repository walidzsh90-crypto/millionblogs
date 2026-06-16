export class BlogResponseDto {
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
  verifiedAt: Date | null;
  visibility: string;
  categories: Array<{ id: string; slug: string; name: string }>;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(
    blog: any,
    categories?: Array<{ id: string; slug: string; name: string }>,
    additionalLanguages?: string[],
  ): BlogResponseDto {
    return {
      id: blog.id,
      userId: blog.userId,
      name: blog.name,
      slug: blog.slug,
      description: blog.description,
      url: blog.url,
      faviconUrl: blog.faviconUrl,
      primaryLanguage: blog.primaryLanguage,
      additionalLanguages: additionalLanguages || [],
      status: blog.status,
      trustStatus: blog.trustStatus,
      verifiedAt: blog.verifiedAt,
      visibility: blog.visibility,
      categories: categories || [],
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };
  }
}
