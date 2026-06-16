import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

export interface SearchAnalyticsEntry {
  query: string;
  resultsCount: number;
  language: string;
  timestamp: Date;
  durationMs: number;
}

@Injectable()
export class SearchAnalyticsService {
  private readonly logger = new Logger(SearchAnalyticsService.name);
  private buffer: SearchAnalyticsEntry[] = [];

  constructor(private readonly prisma: PrismaService) {
    this.startAutoFlush();
  }

  async track(entry: SearchAnalyticsEntry) {
    this.buffer.push(entry);
    if (this.buffer.length >= 50) {
      await this.flush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;
    const batch = [...this.buffer];
    this.buffer = [];

    try {
      const values = batch
        .map(
          (_e, i) =>
            `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`,
        )
        .join(', ');

      const params = batch.flatMap((e) => [
        e.query,
        e.resultsCount,
        e.language,
        e.timestamp,
        e.durationMs,
      ]);

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO search_analytics (query, results_count, language, searched_at, duration_ms)
         VALUES ${values}`,
        ...params,
      );
    } catch (err) {
      this.logger.error('Failed to flush search analytics', err);
      this.buffer.unshift(...batch);
    }
  }

  private startAutoFlush() {
    setInterval(() => this.flush(), 30000);
  }

  async getPopularQueries(limit = 20) {
    const result = await this.prisma.$queryRawUnsafe(
      `SELECT query, COUNT(*) as count
       FROM search_analytics
       GROUP BY query
       ORDER BY count DESC
       LIMIT $1`,
      limit,
    ) as Array<{ query: string; count: bigint }>;
    return result.map((r: { query: string; count: bigint }) => ({ query: r.query, count: Number(r.count) }));
  }

  async getAnalyticsOverview() {
    const [total, today, unique] = await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM search_analytics`,
      ) as Promise<Array<{ count: bigint }>>,
      this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM search_analytics WHERE searched_at >= NOW() - INTERVAL '24 hours'`,
      ) as Promise<Array<{ count: bigint }>>,
      this.prisma.$queryRawUnsafe(
        `SELECT COUNT(DISTINCT query) as count FROM search_analytics`,
      ) as Promise<Array<{ count: bigint }>>,
    ]);
    return {
      totalSearches: Number(total[0]?.count || 0),
      searchesToday: Number(today[0]?.count || 0),
      uniqueQueries: Number(unique[0]?.count || 0),
    };
  }
}
