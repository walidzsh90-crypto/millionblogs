import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../../../src/common/health';
import { PrismaService } from '../../../src/prisma';

describe('HealthService', () => {
  let service: HealthService;

  const mockPrisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a ping response', async () => {
    const result = await service.ping();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });
});
