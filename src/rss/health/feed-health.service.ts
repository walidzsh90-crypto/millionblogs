import { Injectable } from '@nestjs/common';

export interface FeedHealthData {
  successCount: number;
  failureCount: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  averageResponseTime: number | null;
  healthScore: number;
  errorCount: number;
  lastError: string | null;
}

const MAX_HEALTH_SCORE = 100;

@Injectable()
export class FeedHealthService {
  calculateHealth(data: {
    successCount: number;
    failureCount: number;
    averageResponseTime: number | null;
    errorCount: number;
  }): number {
    let score = MAX_HEALTH_SCORE;

    const totalOps = data.successCount + data.failureCount;
    if (totalOps > 0) {
      const successRatio = data.successCount / totalOps;
      score *= 0.4 + 0.6 * successRatio;
    }

    if (data.failureCount > 0) {
      const penalty = Math.min(data.failureCount * 5, 30);
      score -= penalty;
    }

    if (data.averageResponseTime !== null) {
      if (data.averageResponseTime > 10000) score -= 20;
      else if (data.averageResponseTime > 5000) score -= 10;
      else if (data.averageResponseTime > 2000) score -= 5;
    }

    if (data.errorCount > 0) {
      score -= Math.min(data.errorCount * 2, 15);
    }

    return Math.max(0, Math.round(score));
  }

  getHealthLabel(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 25) return 'poor';
    return 'critical';
  }
}
