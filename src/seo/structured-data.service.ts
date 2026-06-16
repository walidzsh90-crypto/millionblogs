import { Injectable } from '@nestjs/common';

@Injectable()
export class StructuredDataService {
  private readonly baseUrl = 'https://millionblogs.com';
  private readonly organizationName = 'MillionBlogs';

  generateArticleSchema(params: {
    title: string;
    excerpt: string | null;
    url: string;
    featuredImageUrl: string | null;
    author: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
    blogName: string;
    blogUrl: string;
    language: string;
  }): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: params.title,
      description: params.excerpt || undefined,
      url: params.url,
      image: params.featuredImageUrl || undefined,
      author: params.author
        ? { '@type': 'Person', name: params.author }
        : { '@type': 'Organization', name: params.blogName },
      datePublished: params.publishedAt?.toISOString() || undefined,
      dateModified: params.updatedAt.toISOString(),
      publisher: {
        '@type': 'Organization',
        name: params.blogName,
        url: params.blogUrl,
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': params.url,
      },
      inLanguage: params.language,
    };
  }

  generateBlogSchema(params: {
    name: string;
    description: string | null;
    url: string;
    language: string;
  }): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: params.name,
      description: params.description || undefined,
      url: params.url,
      inLanguage: params.language,
      publisher: {
        '@type': 'Organization',
        name: this.organizationName,
        url: this.baseUrl,
      },
    };
  }

  generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  generateOrganizationSchema(): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.organizationName,
      url: this.baseUrl,
      description: 'Discover great content from blogs around the world.',
      sameAs: [],
    };
  }
}
