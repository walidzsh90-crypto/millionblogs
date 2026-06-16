import { Injectable, Logger } from '@nestjs/common';
import { PriorityQueueService } from './priority-queue.service';

export interface RetryItem {
  feedId: string;
  attemptCount: number;
  maxAttempts: number;
  lastError: string;
  nextRetryAt: Date;
  priority: number;
}

@Injectable()
export class RetryQueueService {
  private readonly logger = new Logger(RetryQueueService.name);
  private retryQueue: RetryItem[] = [];

  private readonly baseDelayMs = 60000; // 1 min
  private readonly maxDelayMs = 86400000; // 24 hours

  constructor(private readonly priorityQueue: PriorityQueueService) {}

  addToRetry(feedId: string, error: string, attemptCount: number, maxAttempts = 5) {
    if (attemptCount >= maxAttempts) {
      this.logger.warn(`Feed ${feedId} has exceeded max retry attempts (${maxAttempts})`);
      return false;
    }

    const delay = Math.min(
      this.baseDelayMs * Math.pow(2, attemptCount),
      this.maxDelayMs,
    );

    const retryItem: RetryItem = {
      feedId,
      attemptCount,
      maxAttempts,
      lastError: error,
      nextRetryAt: new Date(Date.now() + delay),
      priority: Math.max(0, 10 - attemptCount), // lower priority with each retry
    };

    this.retryQueue.push(retryItem);
    this.retryQueue.sort((a, b) => a.nextRetryAt.getTime() - b.nextRetryAt.getTime());

    this.logger.log(`Feed ${feedId} added to retry queue (attempt ${attemptCount}/${maxAttempts}, delay ${delay}ms)`);
    return true;
  }

  processRetries(): number {
    const now = new Date();
    const ready = this.retryQueue.filter((item) => item.nextRetryAt <= now);
    this.retryQueue = this.retryQueue.filter((item) => item.nextRetryAt > now);

    for (const item of ready) {
      this.priorityQueue.enqueue({
        feedId: item.feedId,
        priority: item.priority,
        attemptCount: item.attemptCount,
        maxAttempts: item.maxAttempts,
      });
    }

    return ready.length;
  }

  getPendingRetries(): RetryItem[] {
    return [...this.retryQueue];
  }

  getRetryCount(feedId: string): number {
    return this.retryQueue.filter((item) => item.feedId === feedId).length;
  }

  removeFromRetry(feedId: string): boolean {
    const index = this.retryQueue.findIndex((item) => item.feedId === feedId);
    if (index !== -1) {
      this.retryQueue.splice(index, 1);
      return true;
    }
    return false;
  }
}
