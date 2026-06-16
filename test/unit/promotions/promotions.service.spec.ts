import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PromotionsService } from '../../../src/promotions/promotions.service';
import { PromotionPackagesRepository } from '../../../src/promotions/promotion-packages.repository';
import { PromotionCampaignsRepository } from '../../../src/promotions/promotion-campaigns.repository';
import { RotationService } from '../../../src/promotions/rotation.service';
import { WalletService } from '../../../src/wallet/wallet.service';
import { FeatureAccessService } from '../../../src/feature-access/feature-access.service';
import { DomainEventPublisher } from '../../../src/events';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let packagesRepo: jest.Mocked<PromotionPackagesRepository>;
  let campaignsRepo: jest.Mocked<PromotionCampaignsRepository>;
  let walletService: jest.Mocked<WalletService>;

  const mockPackage = {
    id: 'pkg-1',
    name: 'Basic Promote',
    slug: 'basic-promote',
    description: 'Basic promotion package',
    creditCost: 100,
    duration: 86400,
    priority: 1,
    status: 'active',
    visibility: 'public',
    sortOrder: 0,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCampaign = {
    id: 'camp-1',
    userId: 'user-1',
    packageId: 'pkg-1',
    type: 'article',
    targetId: 'article-1',
    status: 'draft',
    creditsSpent: 100,
    creditsBudget: 100,
    weight: 1.0,
    startDate: null,
    endDate: null,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    metadata: null as any,
    deletedAt: null,
    package: mockPackage,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    packagesRepo = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAllActive: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    campaignsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      findActiveForRotation: jest.fn(),
      update: jest.fn(),
      recordAnalytics: jest.fn(),
      getStats: jest.fn(),
    } as any;

    walletService = {
      getBalance: jest.fn(),
      debit: jest.fn(),
    } as any;

    const rotationService = { getNext: jest.fn(), recordImpression: jest.fn(), recordClick: jest.fn() } as any;
    const featureAccessService = { hasAccess: jest.fn() } as any;
    const eventPublisher = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PromotionPackagesRepository, useValue: packagesRepo },
        { provide: PromotionCampaignsRepository, useValue: campaignsRepo },
        { provide: RotationService, useValue: rotationService },
        { provide: WalletService, useValue: walletService },
        { provide: FeatureAccessService, useValue: featureAccessService },
        { provide: DomainEventPublisher, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  describe('createCampaign', () => {
    it('should create a campaign with credit consumption', async () => {
      packagesRepo.findById.mockResolvedValue(mockPackage);
      walletService.getBalance.mockResolvedValue({ purchasedBalance: 0, bonusBalance: 0, totalBalance: 500 });
      walletService.debit.mockResolvedValue({ id: 'txn-1', amount: 100, balanceAfter: 400 } as any);
      campaignsRepo.create.mockResolvedValue(mockCampaign);

      const result = await service.createCampaign('user-1', { packageId: 'pkg-1', type: 'article', creditsBudget: 100 });
      expect(result.status).toBe('draft');
      expect(walletService.debit).toHaveBeenCalled();
    });

    it('should reject if package not found', async () => {
      packagesRepo.findById.mockResolvedValue(null);
      await expect(service.createCampaign('user-1', { packageId: 'invalid', type: 'article' })).rejects.toThrow(NotFoundException);
    });

    it('should reject if package is inactive', async () => {
      packagesRepo.findById.mockResolvedValue({ ...mockPackage, status: 'inactive' });
      await expect(service.createCampaign('user-1', { packageId: 'pkg-1', type: 'article' })).rejects.toThrow(BadRequestException);
    });

    it('should reject if insufficient credits', async () => {
      packagesRepo.findById.mockResolvedValue(mockPackage);
      walletService.getBalance.mockResolvedValue({ purchasedBalance: 0, bonusBalance: 0, totalBalance: 10 });
      await expect(service.createCampaign('user-1', { packageId: 'pkg-1', type: 'article' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('activateCampaign', () => {
    it('should activate a draft campaign', async () => {
      campaignsRepo.findById.mockResolvedValue(mockCampaign);
      campaignsRepo.update.mockResolvedValue({ ...mockCampaign, status: 'active' });

      const result = await service.activateCampaign('camp-1');
      expect(result.status).toBe('active');
    });

    it('should reject if already active', async () => {
      campaignsRepo.findById.mockResolvedValue({ ...mockCampaign, status: 'active' });
      await expect(service.activateCampaign('camp-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('credit consumption', () => {
    it('should consume credits atomically', async () => {
      packagesRepo.findById.mockResolvedValue(mockPackage);
      walletService.getBalance.mockResolvedValue({ purchasedBalance: 0, bonusBalance: 0, totalBalance: 500 });
      walletService.debit.mockResolvedValue({ id: 'txn-1', amount: 100, balanceAfter: 400 } as any);
      campaignsRepo.create.mockResolvedValue(mockCampaign);

      await service.createCampaign('user-1', { packageId: 'pkg-1', type: 'article' });
      expect(walletService.debit).toHaveBeenCalledWith('user-1', expect.objectContaining({ amount: 100, source: 'promotion' }));
    });
  });

  describe('getRotation', () => {
    it('should delegate to rotation service', async () => {
      const rotationService = (service as any).rotationService;
      rotationService.getNext.mockResolvedValue([{ campaignId: 'c1' }]);

      const result = await service.getRotation('article', 5);
      expect(result).toHaveLength(1);
    });
  });
});
