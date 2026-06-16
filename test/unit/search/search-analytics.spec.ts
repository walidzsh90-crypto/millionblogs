import { SearchAnalyticsService } from '../../../src/search/search-analytics.service';
import { PrismaService } from '../../../src/prisma';
import { Test, TestingModule } from '@nestjs/testing';

describe('SearchAnalyticsService', () => {
  let service: SearchAnalyticsService;

  const mockPrisma = {
    $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchAnalyticsService>(SearchAnalyticsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track a search', async () => {
    await service.track({
      query: 'test query',
      resultsCount: 10,
      language: 'en',
      timestamp: new Date(),
      durationMs: 50,
    });
    expect(mockPrisma.$executeRawUnsafe).not.toHaveBeenCalled(); // buffered
  });

  it('should flush when buffer reaches 50', async () => {
    for (let i = 0; i < 50; i++) {
      await service.track({
        query: `query ${i}`,
        resultsCount: i,
        language: 'en',
        timestamp: new Date(),
        durationMs: i * 10,
      });
    }
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
  });

  it('should get popular queries', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([
      { query: 'test', count: 10 },
      { query: 'hello', count: 5 },
    ]);

    const result = await service.getPopularQueries(10);
    expect(result).toHaveLength(2);
    expect(result[0].query).toBe('test');
    expect(result[0].count).toBe(10);
  });

  it('should get analytics overview', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ count: 100 }])
      .mockResolvedValueOnce([{ count: 10 }])
      .mockResolvedValueOnce([{ count: 25 }]);

    const result = await service.getAnalyticsOverview();
    expect(result.totalSearches).toBe(100);
    expect(result.searchesToday).toBe(10);
    expect(result.uniqueQueries).toBe(25);
  });
});
