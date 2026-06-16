import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from './domain-event';
import { PrismaService } from '../prisma';

@Injectable()
export class DomainEventPublisher {
  private readonly logger = new Logger(DomainEventPublisher.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  async publish(event: DomainEvent, tx?: any): Promise<void> {
    const db = tx || this.prisma;
    try {
      await db.outboxEvent.create({
        data: {
          eventId: event.eventId,
          eventName: event.eventName,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          payload: event.payload,
          status: 'pending',
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write outbox event ${event.eventId}: ${(err as Error).message}`);
    }

    await this.eventEmitter.emitAsync(event.eventName, event);
  }

  async publishMany(events: DomainEvent[], tx?: any): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event, tx)));
  }

  async emitFromOutbox(outboxEvent: {
    eventId: string;
    eventName: string;
    aggregateId: string;
    aggregateType: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const event = new DomainEvent(
      outboxEvent.eventName,
      outboxEvent.aggregateId,
      outboxEvent.aggregateType,
      outboxEvent.payload,
      outboxEvent.eventId,
    );
    await this.eventEmitter.emitAsync(outboxEvent.eventName, event);
  }
}
