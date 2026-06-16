import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DomainEventPublisher } from './domain-event.publisher';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: true,
    }),
  ],
  providers: [DomainEventPublisher],
  exports: [DomainEventPublisher],
})
export class EventBusModule {}
