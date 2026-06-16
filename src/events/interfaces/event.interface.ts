export interface DomainEvent {
  eventId: string;
  eventName: string;
  occurredAt: Date;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
}

export interface DomainEventSubscriber {
  handle(event: DomainEvent): Promise<void>;
}
