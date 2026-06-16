import { Injectable, Logger } from '@nestjs/common';

export interface DeadLetterItem {
  feedId: string;
  url: string;
  reason: string;
  failedAt: Date;
  attemptCount: number;
  lastError: string;
  lastSuccessAt: Date | null;
}

@Injectable()
export class DeadLetterQueueService {
  private readonly logger = new Logger(DeadLetterQueueService.name);
  private dlq: DeadLetterItem[] = [];

  add(
    feedId: string,
    url: string,
    reason: string,
    attemptCount: number,
    lastError: string,
    lastSuccessAt: Date | null,
  ) {
    const item: DeadLetterItem = {
      feedId,
      url,
      reason,
      failedAt: new Date(),
      attemptCount,
      lastError,
      lastSuccessAt,
    };
    this.dlq.push(item);
    this.logger.warn(`Feed ${feedId} (${url}) moved to dead letter queue: ${reason}`);
  }

  getAll(): DeadLetterItem[] {
    return [...this.dlq];
  }

  getByFeedId(feedId: string): DeadLetterItem | undefined {
    return this.dlq.find((item) => item.feedId === feedId);
  }

  remove(feedId: string): boolean {
    const index = this.dlq.findIndex((item) => item.feedId === feedId);
    if (index !== -1) {
      this.dlq.splice(index, 1);
      return true;
    }
    return false;
  }

  size(): number {
    return this.dlq.length;
  }

  clear() {
    this.dlq = [];
  }
}
