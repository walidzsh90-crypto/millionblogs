import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from '../../../src/sessions/sessions.service';
import { SessionsRepository } from '../../../src/sessions/sessions.repository';
import { DomainEventPublisher } from '../../../src/events/domain-event.publisher';
import { AuditService } from '../../../src/audit/audit.service';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SessionsService', () => {
  let service: SessionsService;
  let repository: SessionsRepository;

  const mockSessions = [
    {
      id: 'session-1',
      userId: 'user-1',
      deviceInfo: 'Windows',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockPrisma = {
    session: {
      create: jest.fn().mockResolvedValue(mockSessions[0]),
      findFirst: jest.fn().mockResolvedValue(mockSessions[0]),
      findMany: jest.fn().mockResolvedValue(mockSessions),
      update: jest.fn().mockResolvedValue(mockSessions[0]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    passwordReset: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        SessionsRepository,
        DomainEventPublisher,
        AuditService,
        { provide: 'PrismaService', useValue: mockPrisma },
        {
          provide: EventEmitter2,
          useValue: { emitAsync: jest.fn().mockResolvedValue([true]) },
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    repository = module.get<SessionsRepository>(SessionsRepository);
  });

  it('should list user sessions', async () => {
    const sessions = await service.getUserSessions('user-1');
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('session-1');
  });

  it('should throw on revoking non-existent session', async () => {
    jest.spyOn(repository, 'findActiveByUserId').mockResolvedValueOnce([]);

    await expect(
      service.revokeSession('non-existent', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
