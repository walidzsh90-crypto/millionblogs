import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from '../../../src/verification/verification.service';
import { DomainEventPublisher } from '../../../src/events/domain-event.publisher';
import { PrismaService } from '../../../src/prisma';
import { ContentCheckStrategy } from '../../../src/verification/strategies/content-check.strategy';
import { RuleEnforcementStrategy } from '../../../src/verification/strategies/rule-enforcement.strategy';
import { HistoricalDataStrategy } from '../../../src/verification/strategies/historical-data.strategy';
import { ReputationAnalysisStrategy } from '../../../src/verification/strategies/reputation-analysis.strategy';

describe('VerificationService', () => {
  let service: VerificationService;
  let contentCheck: ContentCheckStrategy;
  let ruleEnforcement: RuleEnforcementStrategy;
  let historicalData: HistoricalDataStrategy;
  let reputationAnalysis: ReputationAnalysisStrategy;

  const mockBlog = {
    id: 'blog-1',
    userId: 'user-1',
    name: 'Valid Blog Name',
    slug: 'valid-blog',
    url: 'https://validblog.com',
    description: 'A sufficiently long description for the blog to pass content checks',
    primaryLanguage: 'en',
    status: 'pending_verification',
    trustStatus: 'new',
    verifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockPrisma = {
    blog: {
      findFirst: jest.fn().mockResolvedValue(mockBlog),
      update: jest.fn().mockResolvedValue(mockBlog),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([mockBlog]),
    },
    blogVerification: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
    },
    event: {
      create: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        ContentCheckStrategy,
        RuleEnforcementStrategy,
        HistoricalDataStrategy,
        ReputationAnalysisStrategy,
        DomainEventPublisher,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
    contentCheck = module.get<ContentCheckStrategy>(ContentCheckStrategy);
    ruleEnforcement = module.get<RuleEnforcementStrategy>(RuleEnforcementStrategy);
    historicalData = module.get<HistoricalDataStrategy>(HistoricalDataStrategy);
    reputationAnalysis = module.get<ReputationAnalysisStrategy>(ReputationAnalysisStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyBlog', () => {
    it('should verify a blog successfully', async () => {
      const result = await service.verifyBlog('blog-1');
      expect(result.passed).toBe(true);
      expect(result.overallScore).toBeGreaterThanOrEqual(0.6);
      expect(result.strategyResults).toHaveLength(4);
    });

    it('should reject a blog with short name', async () => {
      jest.spyOn(mockPrisma.blog, 'findFirst').mockResolvedValueOnce({
        ...mockBlog,
        name: 'A',
        description: 'short',
      });
      const result = await service.verifyBlog('blog-1');
      expect(result.passed).toBe(false);
    });

    it('should reject a blog with profanity', async () => {
      jest.spyOn(mockPrisma.blog, 'findFirst').mockResolvedValueOnce({
        ...mockBlog,
        name: 'spam blog',
      });
      const result = await service.verifyBlog('blog-1');
      expect(result.passed).toBe(false);
    });

    it('should reject a blog with invalid URL', async () => {
      jest.spyOn(mockPrisma.blog, 'findFirst').mockResolvedValueOnce({
        ...mockBlog,
        url: 'not-a-valid-url',
      });
      const result = await service.verifyBlog('blog-1');
      expect(result.passed).toBe(false);
    });
  });

  describe('getVerificationHistory', () => {
    it('should return verification history', async () => {
      const result = await service.getVerificationHistory('blog-1');
      expect(result).toEqual([]);
    });
  });

  describe('getLatestVerification', () => {
    it('should return latest verification', async () => {
      const result = await service.getLatestVerification('blog-1');
      expect(result).toBeNull();
    });
  });

  describe('strategies', () => {
    it('content check should pass for valid blog', async () => {
      const result = await contentCheck.verify('blog-1');
      expect(result.passed).toBe(true);
    });

    it('rule enforcement should pass for valid URL', async () => {
      const result = await ruleEnforcement.verify('blog-1');
      expect(result.passed).toBe(true);
    });

    it('historical data should pass for new blog', async () => {
      const result = await historicalData.verify('blog-1');
      expect(result.passed).toBe(true);
    });

    it('reputation analysis should pass for clean user', async () => {
      const result = await reputationAnalysis.verify('blog-1');
      expect(result.passed).toBe(true);
    });
  });
});
