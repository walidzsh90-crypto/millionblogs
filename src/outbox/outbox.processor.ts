import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxProcessor implements OnModuleInit {
  private readonly logger = new Logger(OutboxProcessor.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly outboxService: OutboxService) {}

  onModuleInit() {
    this.intervalHandle = setInterval(() => this.processOutbox(), 5000);
  }

  async processOutbox() {
    try {
      const count = await this.outboxService.processPending();
      if (count > 0) {
        this.logger.log(`Processed ${count} outbox events`);
      }
    } catch (err) {
      this.logger.error(`Outbox processing error: ${(err as Error).message}`);
    }
  }

  async cleanup() {
    const count = await this.outboxService.clearProcessed();
    this.logger.log(`Cleaned up ${count} processed outbox events`);
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }
}
