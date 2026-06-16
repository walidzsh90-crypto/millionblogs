import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SubscriptionsService } from '../../../src/subscriptions/subscriptions.service';
import { SubscriptionsRepository } from '../../../src/subscriptions/subscriptions.repository';
import { PlansRepository } from '../../../src/plans/plans.repository';
import { DomainEventPublisher } from '../../../src/events';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subsRepo: jest.Mocked<SubscriptionsRepository>;
  let plansRepo: jest.Mocked<PlansRepository>;

  const mockPlan = {
    id: 'plan-1',
    slug: 'pro-monthly',
    name: 'Pro Monthly',
    price: 999,
    currency: 'usd',
    isFree: false,
    description: 'test desc',
    deletedAt: null,
    visibility: 'public',
    sortOrder: 0,
    status: 'active',
    features: ['pro_features', 'analytics'],
    limits: { maxBlogs: 10, maxArticles: 10000 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubscription = {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'plan-1',
    status: 'pending',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    gracePeriodEnd: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
    cancelledAt: null,
    lastPaymentId: null,
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    plan: mockPlan,
  };

  beforeEach(async () => {
    subsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findActiveByUserId: jest.fn(),
      findActiveByPlanId: jest.fn(),
      findByUserIdAndPlan: jest.fn(),
      update: jest.fn(),
      findExpiring: jest.fn(),
      findGracePeriodExpired: jest.fn(),
      findExpiringSoon: jest.fn(),
      findAll: jest.fn(),
      getStats: jest.fn(),
      createInvoice: jest.fn(),
    } as any;

    plansRepo = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAllActive: jest.fn(),
    } as any;

    const eventPublisher = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: SubscriptionsRepository, useValue: subsRepo },
        { provide: PlansRepository, useValue: plansRepo },
        { provide: DomainEventPublisher, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      plansRepo.findById.mockResolvedValue(mockPlan);
      subsRepo.findActiveByUserId.mockResolvedValue(null);
      subsRepo.create.mockResolvedValue(mockSubscription);

      const result = await service.createSubscription('user-1', 'plan-1');
      expect(result.status).toBe('pending');
      expect(result.planId).toBe('plan-1');
    });

    it('should reject if plan not found', async () => {
      plansRepo.findById.mockResolvedValue(null);
      await expect(service.createSubscription('user-1', 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should reject if plan is free', async () => {
      plansRepo.findById.mockResolvedValue({ ...mockPlan, isFree: true });
      await expect(service.createSubscription('user-1', 'plan-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject if user already has active subscription', async () => {
      plansRepo.findById.mockResolvedValue(mockPlan);
      subsRepo.findActiveByUserId.mockResolvedValue(mockSubscription);
      await expect(service.createSubscription('user-1', 'plan-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('activateSubscription', () => {
    it('should activate a pending subscription', async () => {
      subsRepo.findById.mockResolvedValue(mockSubscription);
      subsRepo.update.mockResolvedValue({ ...mockSubscription, status: 'active' });

      const result = await service.activateSubscription('sub-1');
      expect(result.status).toBe('active');
    });

    it('should reject if subscription not found', async () => {
      subsRepo.findById.mockResolvedValue(null);
      await expect(service.activateSubscription('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should reject if already active', async () => {
      subsRepo.findById.mockResolvedValue({ ...mockSubscription, status: 'active' });
      await expect(service.activateSubscription('sub-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel an active subscription', async () => {
      subsRepo.findById.mockResolvedValue({ ...mockSubscription, status: 'active' });
      subsRepo.update.mockResolvedValue({ ...mockSubscription, status: 'cancelled', cancelledAt: new Date() });

      const result = await service.cancelSubscription('sub-1');
      expect(result.status).toBe('cancelled');
    });

    it('should reject if already cancelled', async () => {
      subsRepo.findById.mockResolvedValue({ ...mockSubscription, status: 'cancelled' });
      await expect(service.cancelSubscription('sub-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('subscription lifecycle', () => {
    it('should process renewals - move to grace period then expire', async () => {
      const now = new Date();
      const expiredSub = { ...mockSubscription, status: 'active', currentPeriodEnd: now };
      const graceSub = { ...mockSubscription, status: 'grace_period', gracePeriodEnd: now };

      subsRepo.findExpiring.mockResolvedValue([expiredSub]);
      subsRepo.findGracePeriodExpired.mockResolvedValue([graceSub]);
      subsRepo.findById
        .mockResolvedValueOnce(expiredSub)
        .mockResolvedValueOnce(graceSub);
      subsRepo.update
        .mockResolvedValueOnce({ ...expiredSub, status: 'grace_period' })
        .mockResolvedValueOnce({ ...graceSub, status: 'expired' });

      const result = await service.processRenewals();
      expect(result.movedToGrace).toBe(1);
      expect(result.expired).toBe(1);
    });
  });

  describe('extendSubscription', () => {
    it('should extend an active subscription', async () => {
      subsRepo.findById.mockResolvedValue(mockSubscription);
      subsRepo.update.mockResolvedValue(mockSubscription);

      const result = await service.extendSubscription('sub-1', 30);
      expect(result).toBeDefined();
    });
  });
});
