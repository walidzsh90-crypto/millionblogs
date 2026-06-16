export class FeedEntryResponseDto {
  id: string;
  feedId: string;
  guid: string;
  canonicalUrl: string | null;
  normalizedUrl: string | null;
  urlHash: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  author: string | null;
  categories: string[] | null;
  language: string | null;
  publishedAt: Date | null;
  discoveredAt: Date;

  static fromEntity(entry: any): FeedEntryResponseDto {
    return {
      id: entry.id,
      feedId: entry.feedId,
      guid: entry.guid,
      canonicalUrl: entry.canonicalUrl,
      normalizedUrl: entry.normalizedUrl,
      urlHash: entry.urlHash,
      title: entry.title,
      excerpt: entry.excerpt,
      imageUrl: entry.imageUrl,
      author: entry.author,
      categories: entry.categories as string[] | null,
      language: entry.language,
      publishedAt: entry.publishedAt,
      discoveredAt: entry.discoveredAt,
    };
  }
}
