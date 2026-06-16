import { Injectable } from '@nestjs/common';

export interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string | null;
  language: string;
  hreflangTags: Array<{ rel: string; hreflang: string; href: string }>;
  noindex: boolean;
}

@Injectable()
export class MetadataService {
  generateArticleMetadata(params: {
    title: string;
    excerpt: string | null;
    canonicalUrl: string;
    featuredImageUrl: string | null;
    language: string;
    author: string | null;
    publishedAt: Date | null;
    blogName: string;
  }): SeoMetadata {
    const description = params.excerpt || `Read ${params.title} on ${params.blogName}`;

    return {
      title: `${params.title} | ${params.blogName}`,
      description,
      canonicalUrl: params.canonicalUrl,
      ogTitle: params.title,
      ogDescription: description,
      ogImage: params.featuredImageUrl,
      ogType: 'article',
      twitterCard: 'summary_large_image',
      twitterTitle: params.title,
      twitterDescription: description,
      twitterImage: params.featuredImageUrl,
      language: params.language,
      hreflangTags: [],
      noindex: false,
    };
  }

  generateBlogMetadata(params: {
    name: string;
    description: string | null;
    canonicalUrl: string;
    language: string;
    articleCount: number;
  }): SeoMetadata {
    const description = params.description || `Explore ${params.name} - a MillionBlogs blog`;

    return {
      title: `${params.name} | MillionBlogs`,
      description,
      canonicalUrl: params.canonicalUrl,
      ogTitle: params.name,
      ogDescription: description,
      ogImage: null,
      ogType: 'website',
      twitterCard: 'summary',
      twitterTitle: params.name,
      twitterDescription: description,
      twitterImage: null,
      language: params.language,
      hreflangTags: [],
      noindex: false,
    };
  }

  generateHomeMetadata(): SeoMetadata {
    return {
      title: 'MillionBlogs - Discover Great Content',
      description: 'Explore millions of blogs and articles from around the world. Discover content in any language, from any category.',
      canonicalUrl: 'https://millionblogs.com',
      ogTitle: 'MillionBlogs',
      ogDescription: 'Discover great content from blogs around the world.',
      ogImage: null,
      ogType: 'website',
      twitterCard: 'summary',
      twitterTitle: 'MillionBlogs',
      twitterDescription: 'Discover great content from blogs around the world.',
      twitterImage: null,
      language: 'en',
      hreflangTags: [],
      noindex: false,
    };
  }
}
