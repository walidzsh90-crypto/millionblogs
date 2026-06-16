import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface NormalizedArticleData {
  title: string;
  excerpt: string | null;
  canonicalUrl: string;
  normalizedUrl: string;
  urlHash: string;
  featuredImageUrl: string | null;
  author: string | null;
  language: string;
  categories: string[];
  publishedAt: Date | null;
}

@Injectable()
export class NormalizationService {
  normalize(data: {
    title?: string;
    excerpt?: string | null;
    canonicalUrl?: string;
    featuredImageUrl?: string | null;
    author?: string | null;
    language?: string;
    categories?: string[];
    publishedAt?: Date | string | null;
  }): NormalizedArticleData & { changes: string[] } {
    const changes: string[] = [];

    const title = this.normalizeTitle(data.title || 'Untitled');
    if (title !== data.title) changes.push('title');

    const excerpt = data.excerpt ? this.normalizeExcerpt(data.excerpt) : null;
    if (excerpt !== data.excerpt) changes.push('excerpt');

    const canonicalUrl = data.canonicalUrl || '';
    const normalizedUrl = this.normalizeUrl(canonicalUrl);
    const urlHash = this.hashUrl(normalizedUrl);
    if (normalizedUrl !== canonicalUrl) changes.push('url');

    const featuredImageUrl = data.featuredImageUrl
      ? this.normalizeUrl(data.featuredImageUrl)
      : null;
    if (featuredImageUrl !== data.featuredImageUrl) changes.push('featuredImageUrl');

    const author = data.author ? this.normalizeAuthor(data.author) : null;
    if (author !== data.author) changes.push('author');

    const language = data.language ? data.language.toLowerCase().trim() : 'en';
    if (language !== data.language) changes.push('language');

    const categories = data.categories
      ? data.categories.map((c) => this.normalizeCategory(c)).filter(Boolean) as string[]
      : [];
    if (JSON.stringify(categories) !== JSON.stringify(data.categories)) changes.push('categories');

    let publishedAt: Date | null = null;
    if (data.publishedAt) {
      const parsed = new Date(data.publishedAt);
      if (!isNaN(parsed.getTime())) publishedAt = parsed;
    }

    return {
      title,
      excerpt,
      canonicalUrl,
      normalizedUrl,
      urlHash,
      featuredImageUrl,
      author,
      language,
      categories,
      publishedAt,
      changes,
    };
  }

  private normalizeTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ')
      .replace(/^["']|["']$/g, '')
      .trim()
      .substring(0, 255);
  }

  private normalizeExcerpt(excerpt: string): string {
    return excerpt
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);
  }

  normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      parsed.hash = '';
      parsed.search = '';
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
      return parsed.href.toLowerCase();
    } catch {
      return url.toLowerCase().trim();
    }
  }

  hashUrl(url: string): string {
    return createHash('sha256').update(url.toLowerCase()).digest('hex');
  }

  private normalizeAuthor(author: string): string {
    return author
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 255);
  }

  private normalizeCategory(category: string): string {
    return category
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }
}
