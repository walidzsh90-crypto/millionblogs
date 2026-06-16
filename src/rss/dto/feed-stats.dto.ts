export class FeedStatsDto {
  totalFeeds: number;
  activeFeeds: number;
  pausedFeeds: number;
  failedFeeds: number;
  disabledFeeds: number;
  archivedFeeds: number;
  totalEntries: number;
  totalSyncs: number;
  totalErrors: number;
  averageHealthScore: number;

  static fromData(data: {
    totalFeeds: number;
    activeFeeds: number;
    pausedFeeds: number;
    failedFeeds: number;
    disabledFeeds: number;
    archivedFeeds: number;
    totalEntries: number;
    totalSyncs: number;
    totalErrors: number;
    averageHealthScore: number;
  }): FeedStatsDto {
    return { ...data };
  }
}
