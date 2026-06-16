import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from './domain-event';

export abstract class DomainEventSubscriber {
  abstract handle(event: DomainEvent): Promise<void>;
}

export function OnDomainEvent(eventName: string): MethodDecorator {
  return OnEvent(eventName, { async: true });
}
