import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchField: 'canonical_url' | 'normalized_url' | 'url_hash' | 'guid' | 'none';
  existingArticleId?: string;
}

@Injectable()
export class ArticleDeduplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async check(
    canonicalUrl: string,
    normalizedUrl: string,
    urlHash: string,
    feedEntryId?: string,
  ): Promise<DuplicateCheckResult> {
    // Check by canonical URL (across all blogs, all feeds, all languages)
    if (canonicalUrl) {
      const existing = await this.prisma.article.findFirst({
        where: { canonicalUrl, deletedAt: null },
        select: { id: true },
      });
      if (existing) {
        return { isDuplicate: true, matchField: 'canonical_url', existingArticleId: existing.id };
      }
    }

    // Check by normalized URL
    if (normalizedUrl) {
      const existing = await this.prisma.article.findFirst({
        where: { normalizedUrl, deletedAt: null },
        select: { id: true },
      });
      if (existing) {
        return { isDuplicate: true, matchField: 'normalized_url', existingArticleId: existing.id };
      }
    }

    // Check by URL hash
    if (urlHash) {
      const existing = await this.prisma.article.findFirst({
        where: { urlHash, deletedAt: null },
        select: { id: true },
      });
      if (existing) {
        return { isDuplicate: true, matchField: 'url_hash', existingArticleId: existing.id };
      }
    }

    // Check by feed entry GUID (if coming from RSS)
    if (feedEntryId) {
      const existing = await this.prisma.article.findFirst({
        where: { feedEntryId, deletedAt: null },
        select: { id: true },
      });
      if (existing) {
        return { isDuplicate: true, matchField: 'guid', existingArticleId: existing.id };
      }
    }

    return { isDuplicate: false, matchField: 'none' };
  }

  async checkBatch(
    entries: Array<{
      canonicalUrl: string;
      normalizedUrl: string;
      urlHash: string;
      feedEntryId?: string;
    }>,
  ): Promise<Map<number, DuplicateCheckResult>> {
    const results = new Map<number, DuplicateCheckResult>();
    const batchSize = 50;

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const checks = batch.map((entry, idx) =>
        this.check(entry.canonicalUrl, entry.normalizedUrl, entry.urlHash, entry.feedEntryId)
          .then((result) => results.set(i + idx, result)),
      );
      await Promise.all(checks);
    }

    return results;
  }
}
