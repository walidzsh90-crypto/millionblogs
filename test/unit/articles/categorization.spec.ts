import { CategorizationService } from '../../../src/articles/pipeline/categorization.service';
import { PrismaService } from '../../../src/prisma';
import { Test, TestingModule } from '@nestjs/testing';

describe('CategorizationService', () => {
  let service: CategorizationService;

  const mockPrisma = {
    category: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'cat-tech', name: 'Technology', slug: 'technology' },
        { id: 'cat-news', name: 'News', slug: 'news' },
        { id: 'cat-science', name: 'Science', slug: 'science' },
      ]),
    },
    blogCategory: {
      findMany: jest.fn().mockResolvedValue([
        { categoryId: 'cat-tech' },
        { categoryId: 'cat-news' },
      ]),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategorizationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategorizationService>(CategorizationService);
  });

  it('should use manual category IDs when valid', async () => {
    const result = await service.categorize('blog-1', [], ['cat-tech', 'cat-news']);
    expect(result.source).toBe('manual');
    expect(result.categoryIds).toContain('cat-tech');
  });

  it('should match RSS categories to existing ones', async () => {
    const result = await service.categorize('blog-1', ['Technology', 'Science'], []);
    expect(result.source).toBe('rss');
    expect(result.categoryIds.length).toBeGreaterThan(0);
  });

  it('should fallback to blog categories', async () => {
    const result = await service.categorize('blog-1', ['Unknown Category'], []);
    expect(result.source).toBe('blog');
    expect(result.categoryIds).toContain('cat-tech');
  });

  it('should return empty when nothing matches', async () => {
    jest.spyOn(mockPrisma, 'blogCategory').mockResolvedValueOnce([]);

    const result = await service.categorize('blog-empty', ['Unknown'], []);
    expect(result.source).toBe('none');
    expect(result.categoryIds).toHaveLength(0);
  });
});
