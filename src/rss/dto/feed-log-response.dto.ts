export class FeedLogResponseDto {
  id: string;
  feedId: string;
  status: string;
  requestTime: Date | null;
  responseTime: Date | null;
  durationMs: number | null;
  statusCode: number | null;
  error: string | null;
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;

  static fromEntity(log: any): FeedLogResponseDto {
    return {
      id: log.id,
      feedId: log.feedId,
      status: log.status,
      requestTime: log.requestTime,
      responseTime: log.responseTime,
      durationMs: log.durationMs,
      statusCode: log.statusCode,
      error: log.error,
      importedCount: log.importedCount,
      skippedCount: log.skippedCount,
      duplicateCount: log.duplicateCount,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: log.createdAt,
    };
  }
}
