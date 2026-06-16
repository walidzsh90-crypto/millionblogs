export class FeedResponseDto {
  id: string;
  blogId: string;
  url: string;
  title: string | null;
  description: string | null;
  siteUrl: string | null;
  feedType: string | null;
  language: string | null;
  icon: string | null;
  status: string;
  syncFrequency: number;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
  successCount: number;
  failureCount: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  averageResponseTime: number | null;
  healthScore: number;
  lastError: string | null;
  errorCount: number;
  priority: number;
  entryCount?: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(feed: any): FeedResponseDto {
    return {
      id: feed.id,
      blogId: feed.blogId,
      url: feed.url,
      title: feed.title,
      description: feed.description,
      siteUrl: feed.siteUrl,
      feedType: feed.feedType,
      language: feed.language,
      icon: feed.icon,
      status: feed.status,
      syncFrequency: feed.syncFrequency,
      lastSyncAt: feed.lastSyncAt,
      nextSyncAt: feed.nextSyncAt,
      successCount: feed.successCount,
      failureCount: feed.failureCount,
      lastSuccessAt: feed.lastSuccessAt,
      lastFailureAt: feed.lastFailureAt,
      averageResponseTime: feed.averageResponseTime,
      healthScore: feed.healthScore,
      lastError: feed.lastError,
      errorCount: feed.errorCount,
      priority: feed.priority,
      entryCount: feed._count?.entries,
      createdAt: feed.createdAt,
      updatedAt: feed.updatedAt,
    };
  }
}
