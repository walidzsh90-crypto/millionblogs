import { Injectable, Logger } from '@nestjs/common';

export interface QueueItem {
  feedId: string;
  priority: number;
  scheduledAt: Date;
  attemptCount: number;
  maxAttempts: number;
}

@Injectable()
export class PriorityQueueService {
  private readonly logger = new Logger(PriorityQueueService.name);
  private queue: QueueItem[] = [];

  enqueue(item: Omit<QueueItem, 'scheduledAt'>) {
    const queueItem: QueueItem = {
      ...item,
      scheduledAt: new Date(),
    };
    this.queue.push(queueItem);
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
    this.logger.debug(`Enqueued feed ${item.feedId} with priority ${item.priority}`);
  }

  enqueueBatch(items: Array<Omit<QueueItem, 'scheduledAt'>>) {
    for (const item of items) {
      this.enqueue(item);
    }
  }

  dequeue(): QueueItem | null {
    if (this.queue.length === 0) return null;
    const now = new Date();
    const index = this.queue.findIndex((item) => item.scheduledAt <= now);
    if (index === -1) return null;
    return this.queue.splice(index, 1)[0];
  }

  dequeueBatch(batchSize: number): QueueItem[] {
    const items: QueueItem[] = [];
    for (let i = 0; i < batchSize; i++) {
      const item = this.dequeue();
      if (!item) break;
      items.push(item);
    }
    return items;
  }

  peek(): QueueItem[] {
    return [...this.queue];
  }

  remove(feedId: string): boolean {
    const index = this.queue.findIndex((item) => item.feedId === feedId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  size(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }

  has(feedId: string): boolean {
    return this.queue.some((item) => item.feedId === feedId);
  }
}
