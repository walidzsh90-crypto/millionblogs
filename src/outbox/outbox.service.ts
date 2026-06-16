import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma';
import { DomainEventPublisher } from '../events';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async create(event: {
    eventId: string;
    eventName: string;
    aggregateId: string;
    aggregateType: string;
    payload: Record<string, unknown>;
  }, tx?: any) {
    const db = tx || this.prisma;
    return db.outboxEvent.create({
      data: {
        eventId: event.eventId,
        eventName: event.eventName,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        payload: event.payload,
        status: 'pending',
      },
    });
  }

  async processPending(batchSize = 50): Promise<number> {
    const events = await this.prisma.outboxEvent.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    if (events.length === 0) return 0;

    const publisher = this.moduleRef.get(DomainEventPublisher, { strict: false });

    let processed = 0;
    for (const event of events) {
      try {
        await publisher.emitFromOutbox(event);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'processed', processedAt: new Date() },
        });
        processed++;
      } catch (err) {
        this.logger.error(`Outbox event ${event.id} (${event.eventName}) failed: ${(err as Error).message}`);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            retryCount: { increment: 1 },
            status: event.retryCount >= 5 ? 'failed' : 'pending',
          },
        });
      }
    }

    return processed;
  }

  async countPending(): Promise<number> {
    return this.prisma.outboxEvent.count({ where: { status: 'pending' } });
  }

  async clearProcessed(olderThanHours = 24): Promise<number> {
    const result = await this.prisma.outboxEvent.deleteMany({
      where: {
        status: 'processed',
        processedAt: { lte: new Date(Date.now() - olderThanHours * 60 * 60 * 1000) },
      },
    });
    return result.count;
  }
}
