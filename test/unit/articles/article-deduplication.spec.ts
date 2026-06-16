import { Test, TestingModule } from '@nestjs/testing';
import { ArticleDeduplicationService } from '../../../src/articles/pipeline/article-deduplication.service';
import { PrismaService } from '../../../src/prisma';

describe('ArticleDeduplicationService', () => {
  let service: ArticleDeduplicationService;

  const mockPrisma = {
    article: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleDeduplicationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ArticleDeduplicationService>(ArticleDeduplicationService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect duplicate by canonical URL', async () => {
    mockPrisma.article.findFirst.mockResolvedValueOnce({ id: 'existing-1' });

    const result = await service.check(
      'https://example.com/article',
      'https://example.com/article',
      'hash123',
    );
    expect(result.isDuplicate).toBe(true);
    expect(result.matchField).toBe('canonical_url');
  });

  it('should detect duplicate by normalized URL', async () => {
    mockPrisma.article.findFirst
      .mockResolvedValueOnce(null)  // canonical URL
      .mockResolvedValueOnce({ id: 'existing-2' });  // normalized URL

    const result = await service.check(
      'https://example.com/article',
      'https://example.com/article-alt',
      'hash456',
    );
    expect(result.isDuplicate).toBe(true);
    expect(result.matchField).toBe('normalized_url');
  });

  it('should detect duplicate by URL hash', async () => {
    mockPrisma.article.findFirst
      .mockResolvedValueOnce(null)  // canonical URL
      .mockResolvedValueOnce(null)  // normalized URL
      .mockResolvedValueOnce({ id: 'existing-3' });  // URL hash

    const result = await service.check(
      'https://example.com/article-a',
      'https://example.com/article-b',
      'same-hash',
    );
    expect(result.isDuplicate).toBe(true);
    expect(result.matchField).toBe('url_hash');
  });

  it('should detect duplicate by feed entry GUID', async () => {
    mockPrisma.article.findFirst
      .mockResolvedValueOnce(null)  // canonical URL
      .mockResolvedValueOnce(null)  // normalized URL
      .mockResolvedValueOnce(null)  // URL hash
      .mockResolvedValueOnce({ id: 'existing-4' });  // feed entry

    const result = await service.check(
      'https://example.com/article',
      'https://example.com/article',
      'hash789',
      'feed-entry-1',
    );
    expect(result.isDuplicate).toBe(true);
    expect(result.matchField).toBe('guid');
  });

  it('should return no duplicate for new entry', async () => {
    mockPrisma.article.findFirst.mockResolvedValue(null);

    const result = await service.check(
      'https://example.com/new-article',
      'https://example.com/new-article',
      'new-hash',
    );
    expect(result.isDuplicate).toBe(false);
    expect(result.matchField).toBe('none');
  });

  it('should check batch entries', async () => {
    mockPrisma.article.findFirst.mockResolvedValue(null);

    const results = await service.checkBatch([
      { canonicalUrl: 'https://example.com/a', normalizedUrl: 'https://example.com/a', urlHash: 'hash-a' },
      { canonicalUrl: 'https://example.com/b', normalizedUrl: 'https://example.com/b', urlHash: 'hash-b' },
      { canonicalUrl: 'https://example.com/c', normalizedUrl: 'https://example.com/c', urlHash: 'hash-c' },
    ]);

    expect(results.size).toBe(3);
    for (const [, result] of results) {
      expect(result.isDuplicate).toBe(false);
    }
  });
});
