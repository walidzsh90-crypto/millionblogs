import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../../src/audit';
import { PrismaService } from '../../../src/prisma';

describe('AuditService', () => {
  let service: AuditService;

  const mockPrisma = {
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should record an audit entry', async () => {
    await expect(
      service.record({
        actorId: 'user-1',
        action: 'test.action',
        resourceType: 'test',
        resourceId: 'resource-1',
        changeset: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        metadata: null,
      }),
    ).resolves.not.toThrow();
  });

  it('should query audit logs', async () => {
    const result = await service.query({ page: 1, pageSize: 10 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
