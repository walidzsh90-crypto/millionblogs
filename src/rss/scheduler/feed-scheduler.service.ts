import { Injectable, Logger } from '@nestjs/common';
import { PriorityQueueService } from './priority-queue.service';
import { RetryQueueService } from './retry-queue.service';
import { DeadLetterQueueService } from './dead-letter-queue.service';

@Injectable()
export class FeedSchedulerService {
  private readonly logger = new Logger(FeedSchedulerService.name);
  private isRunning = false;
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  readonly FREQUENCIES = {
    FIFTEEN_MINUTES: 900,
    ONE_HOUR: 3600,
    SIX_HOURS: 21600,
    TWELVE_HOURS: 43200,
    TWENTY_FOUR_HOURS: 86400,
  } as const;

  constructor(
    private readonly priorityQueue: PriorityQueueService,
    private readonly retryQueue: RetryQueueService,
    private readonly deadLetterQueue: DeadLetterQueueService,
  ) {}

  scheduleManualSync(feedId: string, priority = 10) {
    this.priorityQueue.enqueue({
      feedId,
      priority,
      attemptCount: 0,
      maxAttempts: 3,
    });
    this.logger.log(`Manual sync scheduled for feed ${feedId}`);
  }

  scheduleAutoSync(feeds: Array<{ id: string; syncFrequency: number; priority: number }>) {
    for (const feed of feeds) {
      this.priorityQueue.enqueue({
        feedId: feed.id,
        priority: feed.priority,
        attemptCount: 0,
        maxAttempts: 3,
      });
    }
    this.logger.log(`Auto-sync scheduled for ${feeds.length} feeds`);
  }

  startAutoSync(syncCallback: (feedId: string) => Promise<void>, intervalMs = 60000) {
    if (this.isRunning) {
      this.logger.warn('Auto-sync scheduler already running');
      return;
    }

    this.isRunning = true;
    this.syncTimer = setInterval(async () => {
      try {
        const retryCount = this.retryQueue.processRetries();
        if (retryCount > 0) {
          this.logger.log(`Moved ${retryCount} feeds from retry to priority queue`);
        }

        const batch = this.priorityQueue.dequeueBatch(5);
        for (const item of batch) {
          try {
            await syncCallback(item.feedId);
          } catch (err) {
            this.logger.error(`Sync failed for feed ${item.feedId}`, err);
          }
        }
      } catch (err) {
        this.logger.error('Auto-sync cycle error', err);
      }
    }, intervalMs);

    this.logger.log(`Auto-sync scheduler started (interval: ${intervalMs}ms)`);
  }

  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.isRunning = false;
    this.logger.log('Auto-sync scheduler stopped');
  }

  getQueueStatus() {
    return {
      isRunning: this.isRunning,
      pendingQueue: this.priorityQueue.size(),
      retryQueue: this.retryQueue.getPendingRetries().length,
      deadLetterQueue: this.deadLetterQueue.size(),
      retryItems: this.retryQueue.getPendingRetries(),
      deadLetterItems: this.deadLetterQueue.getAll(),
    };
  }

  getAvailableFrequencies() {
    return this.FREQUENCIES;
  }
}
