import { v4 as uuidv4 } from 'uuid';

export class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly eventName: string,
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly payload: Record<string, unknown> = {},
    eventId?: string,
    occurredAt?: Date,
  ) {
    this.eventId = eventId ?? uuidv4();
    this.occurredAt = occurredAt ?? new Date();
  }
}
