import { Test, TestingModule } from '@nestjs/testing';
import { FeatureAccessService } from '../../../src/feature-access/feature-access.service';
import { FounderRepository } from '../../../src/founder/founder.repository';
import { SubscriptionsRepository } from '../../../src/subscriptions/subscriptions.repository';
import { PlansRepository } from '../../../src/plans/plans.repository';

describe('FeatureAccessService', () => {
  let service: FeatureAccessService;
  let founderRepo: jest.Mocked<FounderRepository>;
  let subsRepo: jest.Mocked<SubscriptionsRepository>;
  let plansRepo: jest.Mocked<PlansRepository>;

  const mockFounderSeat = {
    id: 'seat-1',
    userId: 'founder-user',
    programId: 'prog-1',
    version: 1,
    claimedAt: new Date(),
    createdAt: new Date(),
    program: {
      slug: 'founder-pro',
      name: 'Founder Pro',
      badgeLabel: 'Founder Pro',
      benefits: { lifetimeAccess: true, proFeatures: true, noRecurringBilling: true },
      limits: { maxBlogs: 10, maxArticles: 10000 },
    },
  };

  const mockMasterSeat = {
    ...mockFounderSeat,
    program: {
      slug: 'founder-master',
      name: 'Founder Master',
      badgeLabel: 'Founder Master',
      benefits: { lifetimeAccess: true, masterFeatures: true, welcomeCredits: true },
      limits: { maxBlogs: 100, maxArticles: 100000 },
    },
  };

  const mockActiveSub = {
    id: 'sub-1',
    userId: 'sub-user',
    planId: 'plan-1',
    status: 'active',
    plan: {
      id: 'plan-1',
      slug: 'pro-monthly',
      name: 'Pro Monthly',
      price: 999,
      features: ['pro_features', 'analytics', 'custom_domain'],
      limits: { maxBlogs: 10, maxArticles: 10000, maxFeeds: 100 },
    },
  };

  const mockPlans = [
    { slug: 'free', limits: { maxBlogs: 1, maxArticles: 100 } },
    { slug: 'pro-monthly', limits: { maxBlogs: 10, maxArticles: 10000 } },
    { slug: 'master-monthly', limits: { maxBlogs: 100, maxArticles: 100000 } },
    { slug: 'founder-pro', limits: { maxBlogs: 10, maxArticles: 10000 } },
    { slug: 'founder-master', limits: { maxBlogs: 100, maxArticles: 100000 } },
  ];

  beforeEach(async () => {
    founderRepo = {
      getSeatByUserId: jest.fn(),
    } as any;

    subsRepo = {
      findActiveByUserId: jest.fn(),
    } as any;

    plansRepo = {
      findAllActive: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureAccessService,
        { provide: FounderRepository, useValue: founderRepo },
        { provide: SubscriptionsRepository, useValue: subsRepo },
        { provide: PlansRepository, useValue: plansRepo },
      ],
    }).compile();

    service = module.get<FeatureAccessService>(FeatureAccessService);
  });

  describe('resolve', () => {
    it('should return founder access for founder user', async () => {
      founderRepo.getSeatByUserId.mockResolvedValue(mockFounderSeat);
      subsRepo.findActiveByUserId.mockResolvedValue(null);
      plansRepo.findAllActive.mockResolvedValue(mockPlans);

      const access = await service.resolve('founder-user');
      expect(access.isFounder).toBe(true);
      expect(access.founderBadge).toBe('Founder Pro');
      expect(access.effectivePlan).toBe('founder_pro');
      expect(access.features).toContain('lifetimeAccess');
    });

    it('should return master founder access', async () => {
      founderRepo.getSeatByUserId.mockResolvedValue(mockMasterSeat);
      subsRepo.findActiveByUserId.mockResolvedValue(null);
      plansRepo.findAllActive.mockResolvedValue(mockPlans);

      const access = await service.resolve('master-user');
      expect(access.isFounder).toBe(true);
      expect(access.founderBadge).toBe('Founder Master');
      expect(access.effectivePlan).toBe('founder_master');
    });

    it('should return subscription access for subscriber', async () => {
      founderRepo.getSeatByUserId.mockResolvedValue(null);
      subsRepo.findActiveByUserId.mockResolvedValue(mockActiveSub);
      plansRepo.findAllActive.mockResolvedValue(mockPlans);

      const access = await service.resolve('sub-user');
      expect(access.isFounder).toBe(false);
      expect(access.hasActiveSubscription).toBe(true);
      expect(access.effectivePlan).toBe('pro-monthly');
      expect(access.features).toContain('pro_features');
    });

    it('should return free access for free user', async () => {
      founderRepo.getSeatByUserId.mockResolvedValue(null);
      subsRepo.findActiveByUserId.mockResolvedValue(null);
      plansRepo.findAllActive.mockResolvedValue(mockPlans);

      const access = await service.resolve('free-user');
      expect(access.isFounder).toBe(false);
      expect(access.hasActiveSubscription).toBe(false);
      expect(access.effectivePlan).toBe('free');
      expect(access.features).toContain('basic_blogging');
    });
  });

  describe('hasAccess', () => {
    it('should return true if feature is available', async () => {
      founderRepo.getSeatByUserId.mockResolvedValue(mockFounderSeat);
      subsRepo.findActiveByUserId.mockResolvedValue(null);
      plansRepo.findAllActive.mockResolvedValue(mockPlans);

      const result = await service.hasAccess('founder-user', 'lifetimeAccess');
      expect(result).toBe(true);
    });

    it('should return false if feature is not available', async () => {
      founderRepo.getSeatByUserId.mockResolvedValue(null);
      subsRepo.findActiveByUserId.mockResolvedValue(null);
      plansRepo.findAllActive.mockResolvedValue(mockPlans);

      const result = await service.hasAccess('free-user', 'lifetimeAccess');
      expect(result).toBe(false);
    });
  });
});
