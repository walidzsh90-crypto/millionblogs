import { Test, TestingModule } from '@nestjs/testing';
import { LoggingService } from '../../../src/common/logging';
import { ConfigModule } from '../../../src/config';

describe('LoggingService', () => {
  let service: LoggingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [LoggingService],
    }).compile();

    service = module.get<LoggingService>(LoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log info without throwing', () => {
    expect(() => service.info('test message')).not.toThrow();
  });

  it('should log error without throwing', () => {
    expect(() => service.error('test error')).not.toThrow();
  });

  it('should log with metadata without throwing', () => {
    expect(() => service.info('test', { key: 'value' })).not.toThrow();
  });
});
