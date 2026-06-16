export interface ParsedFeedEntry {
  guid: string;
  canonicalUrl: string;
  normalizedUrl: string;
  urlHash: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  author: string | null;
  categories: string[];
  language: string | null;
  publishedAt: Date | null;
}

export interface ParsedFeed {
  title: string | null;
  description: string | null;
  siteUrl: string | null;
  language: string | null;
  icon: string | null;
  feedType: 'rss' | 'atom';
  entries: ParsedFeedEntry[];
}
