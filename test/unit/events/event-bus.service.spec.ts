import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEventPublisher } from '../../../src/events';
import { DomainEvent } from '../../../src/events';

describe('DomainEventPublisher', () => {
  let publisher: DomainEventPublisher;
  let emitter: EventEmitter2;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainEventPublisher,
        {
          provide: EventEmitter2,
          useValue: {
            emitAsync: jest.fn().mockResolvedValue([true]),
          },
        },
      ],
    }).compile();

    publisher = module.get<DomainEventPublisher>(DomainEventPublisher);
    emitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(publisher).toBeDefined();
  });

  it('should publish domain events', async () => {
    const event = new DomainEvent(
      'test.event',
      'aggregate-1',
      'test',
      { key: 'value' },
    );

    await publisher.publish(event);
    expect(emitter.emitAsync).toHaveBeenCalledWith('test.event', event);
  });
});
