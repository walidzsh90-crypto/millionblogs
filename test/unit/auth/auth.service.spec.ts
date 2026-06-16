import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/auth.service';
import { UsersService } from '../../../src/users/users.service';
import { UsersRepository } from '../../../src/users/users.repository';
import { SessionsRepository } from '../../../src/sessions/sessions.repository';
import { PasswordService } from '../../../src/common/security/password.service';
import { BruteForceService } from '../../../src/common/security/brute-force.service';
import { AuditService } from '../../../src/audit/audit.service';
import { ActivityService } from '../../../src/activity/activity.service';
import { DomainEventPublisher } from '../../../src/events/domain-event.publisher';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../../src/config/config.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: UsersRepository;
  let sessionsRepository: SessionsRepository;
  let passwordService: PasswordService;
  let bruteForce: BruteForceService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '',
    displayName: 'Test User',
    role: 'blogger',
    avatarUrl: null,
    emailVerifiedAt: null,
    language: 'en',
    timezone: 'UTC',
    badgeVisibility: true,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    user: {
      create: jest.fn().mockResolvedValue(mockUser),
      findFirst: jest.fn().mockResolvedValue(mockUser),
      findUnique: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    },
    session: {
      create: jest.fn().mockResolvedValue({ id: 'session-1' }),
      findFirst: jest.fn().mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        user: mockUser,
      }),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    passwordReset: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
      }),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    bruteForceAttempt: {
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    activityLog: { create: jest.fn().mockResolvedValue({}) },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        UsersRepository,
        SessionsRepository,
        PasswordService,
        BruteForceService,
        AuditService,
        ActivityService,
        DomainEventPublisher,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-access-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                JWT_ACCESS_SECRET: 'test-secret',
                JWT_REFRESH_EXPIRY: '7d',
                JWT_ACCESS_EXPIRY: '15m',
                OTEL_SERVICE_NAME: 'millionblogs',
              };
              return config[key];
            }),
            isTest: true,
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emitAsync: jest.fn().mockResolvedValue([true]),
          },
        },
        {
          provide: 'PrismaService',
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    sessionsRepository = module.get<SessionsRepository>(SessionsRepository);
    passwordService = module.get<PasswordService>(PasswordService);
    bruteForce = module.get<BruteForceService>(BruteForceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const result = await service.register(
        { email: 'new@test.com', password: 'Test1234!', displayName: 'New User' },
        'Windows',
        '127.0.0.1',
        'test-agent',
      );

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('should throw on invalid credentials', async () => {
      jest.spyOn(passwordService, 'compare').mockResolvedValueOnce(false);

      await expect(
        service.login(
          { email: 'test@example.com', password: 'wrong' },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw on blocked account', async () => {
      jest.spyOn(bruteForce, 'isBlocked').mockResolvedValueOnce(true);

      await expect(
        service.login({ email: 'blocked@test.com', password: 'Test1234!' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const result = await service.refresh({ refreshToken: 'valid-token' });
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw on invalid refresh token', async () => {
      jest.spyOn(sessionsRepository, 'findByRefreshToken').mockResolvedValueOnce(null as any);

      await expect(
        service.refresh({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout without throwing', async () => {
      await expect(service.logout('valid-token')).resolves.not.toThrow();
    });
  });

  describe('forgot-password', () => {
    it('should request password reset silently', async () => {
      await expect(
        service.requestPasswordReset('test@example.com'),
      ).resolves.not.toThrow();
    });

    it('should not throw for unknown email', async () => {
      jest.spyOn(usersRepository, 'findByEmail').mockResolvedValueOnce(null);
      await expect(
        service.requestPasswordReset('unknown@test.com'),
      ).resolves.not.toThrow();
    });
  });
});
