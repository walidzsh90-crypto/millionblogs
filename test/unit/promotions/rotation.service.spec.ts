import { Test, TestingModule } from '@nestjs/testing';
import { RotationService } from '../../../src/promotions/rotation.service';
import { PromotionCampaignsRepository } from '../../../src/promotions/promotion-campaigns.repository';

describe('RotationService', () => {
  let service: RotationService;
  let repo: jest.Mocked<PromotionCampaignsRepository>;

  const mockCampaigns = [
    {
      id: 'c1',
      type: 'article',
      targetId: 'article-1',
      weight: 1.0,
      impressions: 10,
      creditsBudget: 100,
      creditsSpent: 20,
      package: { name: 'Basic', priority: 1 },
    },
    {
      id: 'c2',
      type: 'article',
      targetId: 'article-2',
      weight: 2.0,
      impressions: 5,
      creditsBudget: 100,
      creditsSpent: 10,
      package: { name: 'Premium', priority: 5 },
    },
    {
      id: 'c3',
      type: 'showcase',
      targetId: 'showcase-1',
      weight: 1.5,
      impressions: 100,
      creditsBudget: 200,
      creditsSpent: 50,
      package: { name: 'Basic', priority: 1 },
    },
  ];

  beforeEach(async () => {
    repo = {
      findActiveForRotation: jest.fn(),
      recordAnalytics: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotationService,
        { provide: PromotionCampaignsRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<RotationService>(RotationService);
  });

  describe('getNext', () => {
    it('should return top campaigns by score for article type', async () => {
      repo.findActiveForRotation.mockResolvedValue(mockCampaigns as any);

      const result = await service.getNext('article', 2);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('article');
    });

    it('should return showcase campaigns', async () => {
      repo.findActiveForRotation.mockResolvedValue(mockCampaigns as any);

      const result = await service.getNext('showcase', 5);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('showcase');
    });

    it('should return empty array if no active campaigns', async () => {
      repo.findActiveForRotation.mockResolvedValue([]);

      const result = await service.getNext('article', 5);
      expect(result).toHaveLength(0);
    });

    it('should prefer campaigns with higher weight and fewer impressions', async () => {
      const campaigns = [
        { id: 'high-weight', type: 'article', targetId: 'a1', weight: 10, impressions: 100, creditsBudget: 100, creditsSpent: 0, package: { name: 'Premium', priority: 5 } },
        { id: 'low-impressions', type: 'article', targetId: 'a2', weight: 1, impressions: 0, creditsBudget: 100, creditsSpent: 0, package: { name: 'Basic', priority: 1 } },
      ];
      repo.findActiveForRotation.mockResolvedValue(campaigns as any);

      const result = await service.getNext('article', 5);
      expect(result[0].campaignId).toBe('low-impressions');
    });
  });

  describe('recordImpression', () => {
    it('should record impression analytics', async () => {
      repo.recordAnalytics.mockResolvedValue({ id: 'analytics-1', type: 'impression', metadata: null as any, recordedAt: new Date(), campaignId: 'c1' } as any);

      await service.recordImpression('c1');
      expect(repo.recordAnalytics).toHaveBeenCalledWith('c1', 'impression');
    });
  });

  describe('recordClick', () => {
    it('should record click analytics', async () => {
      repo.recordAnalytics.mockResolvedValue({ id: 'analytics-1', type: 'impression', metadata: null as any, recordedAt: new Date(), campaignId: 'c1' } as any);

      await service.recordClick('c1');
      expect(repo.recordAnalytics).toHaveBeenCalledWith('c1', 'click');
    });
  });
});
