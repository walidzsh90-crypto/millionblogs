import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { FeedFilterDto } from './dto/feed-filter.dto';

@Injectable()
export class FeedsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    blogId: string;
    url: string;
    title?: string;
    description?: string;
    siteUrl?: string;
    feedType?: string;
    language?: string;
    icon?: string;
    syncFrequency?: number;
    status?: string;
  }) {
    return this.prisma.rssFeed.create({
      data,
      include: { _count: { select: { entries: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.rssFeed.findFirst({
      where: { id, archivedAt: null },
      include: { _count: { select: { entries: true } } },
    });
  }

  async findByUrl(url: string) {
    return this.prisma.rssFeed.findFirst({
      where: { url, archivedAt: null },
    });
  }

  async findByBlogId(blogId: string) {
    return this.prisma.rssFeed.findMany({
      where: { blogId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { entries: true } } },
    });
  }

  async findMany(filter: FeedFilterDto) {
    const where: Record<string, unknown> = { archivedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.blogId) where.blogId = filter.blogId;
    if (filter.feedType) where.feedType = filter.feedType;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { url: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.rssFeed.findMany({
        where: where as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { entries: true } } },
      }),
      this.prisma.rssFeed.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.rssFeed.update({
      where: { id },
      data,
      include: { _count: { select: { entries: true } } },
    });
  }

  async softDelete(id: string) {
    return this.prisma.rssFeed.update({
      where: { id },
      data: { status: 'archived', archivedAt: new Date() },
    });
  }

  async countByStatus(status: string) {
    return this.prisma.rssFeed.count({ where: { status, archivedAt: null } });
  }

  async findFeedsDueForSync() {
    return this.prisma.rssFeed.findMany({
      where: {
        status: 'active',
        archivedAt: null,
        OR: [
          { nextSyncAt: { lte: new Date() } },
          { nextSyncAt: null },
        ],
      },
      orderBy: { priority: 'desc' },
      take: 50,
    });
  }

  async getStats() {
    const [total, active, paused, failed, disabled, archived, entries] = await Promise.all([
      this.prisma.rssFeed.count({ where: { archivedAt: null } }),
      this.prisma.rssFeed.count({ where: { status: 'active', archivedAt: null } }),
      this.prisma.rssFeed.count({ where: { status: 'paused', archivedAt: null } }),
      this.prisma.rssFeed.count({ where: { status: 'failed', archivedAt: null } }),
      this.prisma.rssFeed.count({ where: { status: 'disabled', archivedAt: null } }),
      this.prisma.rssFeed.count({ where: { status: 'archived' } }),
      this.prisma.rssFeedEntry.count(),
    ]);
    return { total, active, paused, failed, disabled, archived, entries };
  }

  async getAverageHealthScore() {
    const result = await this.prisma.rssFeed.aggregate({
      _avg: { healthScore: true },
      where: { archivedAt: null },
    });
    return result._avg.healthScore || 0;
  }

  // Entry methods
  async createEntry(data: {
    feedId: string;
    guid: string;
    canonicalUrl: string;
    normalizedUrl: string;
    urlHash: string;
    title: string;
    excerpt?: string;
    imageUrl?: string;
    author?: string;
    categories?: string[];
    language?: string;
    publishedAt?: Date;
  }) {
    return this.prisma.rssFeedEntry.create({ data });
  }

  async findEntryByGuid(feedId: string, guid: string) {
    return this.prisma.rssFeedEntry.findFirst({
      where: { feedId, guid },
    });
  }

  async findEntryByHash(feedId: string, urlHash: string) {
    return this.prisma.rssFeedEntry.findFirst({
      where: { feedId, urlHash },
    });
  }

  async countFeedEntries(feedId: string) {
    return this.prisma.rssFeedEntry.count({ where: { feedId } });
  }

  async getFeedEntries(feedId: string, limit = 50) {
    return this.prisma.rssFeedEntry.findMany({
      where: { feedId },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async getFeedsByBlogId(blogId: string) {
    return this.prisma.rssFeed.findMany({
      where: { blog: { id: blogId }, archivedAt: null },
      include: { _count: { select: { entries: true } } },
    });
  }

  async getEntryStats() {
    const [total, withAuthor, withImage, withCategories] = await Promise.all([
      this.prisma.rssFeedEntry.count(),
      this.prisma.rssFeedEntry.count({ where: { author: { not: null } } }),
      this.prisma.rssFeedEntry.count({ where: { imageUrl: { not: null } } }),
      this.prisma.rssFeedEntry.count({ where: { categories: { not: null } } }),
    ]);
    return { total, withAuthor, withImage, withCategories };
  }

  async getSyncLogs(feedId: string, limit = 50) {
    return this.prisma.rssFeedLog.findMany({
      where: { feedId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async createSyncLog(data: {
    feedId: string;
    status: string;
    requestTime?: Date;
    responseTime?: Date;
    durationMs?: number;
    statusCode?: number;
    error?: string;
    importedCount: number;
    skippedCount: number;
    duplicateCount: number;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.rssFeedLog.create({ data });
  }
}
