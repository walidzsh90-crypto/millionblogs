import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../src/users/users.service';
import { UsersRepository } from '../../../src/users/users.repository';
import { PasswordService } from '../../../src/common/security/password.service';
import { ActivityService } from '../../../src/activity/activity.service';
import { DomainEventPublisher } from '../../../src/events/domain-event.publisher';
import { ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'blogger',
    avatarUrl: null,
    emailVerifiedAt: null,
    language: 'en',
    timezone: 'UTC',
    badgeVisibility: true,
    isActive: true,
    passwordHash: '$2b$12$hash',
    emailVerifyToken: null,
    passwordChangedAt: new Date(),
    passwordHistory: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockPrisma = {
    user: {
      create: jest.fn().mockResolvedValue(mockUser),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    },
    activityLog: { create: jest.fn().mockResolvedValue({}) },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        UsersRepository,
        PasswordService,
        ActivityService,
        DomainEventPublisher,
        { provide: 'PrismaService', useValue: mockPrisma },
        {
          provide: EventEmitter2,
          useValue: { emitAsync: jest.fn().mockResolvedValue([true]) },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const result = await service.create({
        email: 'new@test.com',
        password: 'StrongPass1!',
        displayName: 'New User',
      });

      expect(result.email).toBe(mockUser.email);
    });

    it('should throw on duplicate email', async () => {
      jest.spyOn(repository, 'findByEmail').mockResolvedValueOnce(mockUser as any);

      await expect(
        service.create({
          email: 'existing@test.com',
          password: 'StrongPass1!',
          displayName: 'Existing',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
