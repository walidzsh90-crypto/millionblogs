import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

export interface SyncLogInput {
  feedId: string;
  status: 'success' | 'failed';
  requestTime?: Date;
  responseTime?: Date;
  durationMs?: number;
  statusCode?: number;
  error?: string;
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class FeedLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: SyncLogInput) {
    return this.prisma.rssFeedLog.create({
      data: {
        feedId: input.feedId,
        status: input.status,
        requestTime: input.requestTime,
        responseTime: input.responseTime,
        durationMs: input.durationMs,
        statusCode: input.statusCode,
        error: input.error,
        importedCount: input.importedCount,
        skippedCount: input.skippedCount,
        duplicateCount: input.duplicateCount,
        metadata: input.metadata as any || undefined,
      },
    });
  }

  async getLogs(feedId: string, limit = 50) {
    return this.prisma.rssFeedLog.findMany({
      where: { feedId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getFailedLogs(feedId: string, limit = 20) {
    return this.prisma.rssFeedLog.findMany({
      where: { feedId, status: 'failed' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRecentActivity(feedId: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.prisma.rssFeedLog.findMany({
      where: { feedId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSyncStats(feedId: string) {
    const [totalSyncs, totalErrors, lastSync, recent] = await Promise.all([
      this.prisma.rssFeedLog.count({ where: { feedId } }),
      this.prisma.rssFeedLog.count({ where: { feedId, status: 'failed' } }),
      this.prisma.rssFeedLog.findFirst({
        where: { feedId, status: 'success' },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rssFeedLog.findMany({
        where: { feedId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalSyncs,
      totalErrors,
      lastSyncAt: lastSync?.createdAt || null,
      recentLogs: recent,
    };
  }
}
