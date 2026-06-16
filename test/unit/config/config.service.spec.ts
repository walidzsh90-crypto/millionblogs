import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../../../src/config';
import { ConfigService } from '../../../src/config';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the default port', () => {
    const port = service.get('PORT');
    expect(port).toBe(3000);
  });

  it('should return parsed CORS origins', () => {
    const origins = service.corsOrigins;
    expect(Array.isArray(origins)).toBe(true);
  });

  it('should detect test environment', () => {
    expect(service.isTest).toBe(true);
  });
});
