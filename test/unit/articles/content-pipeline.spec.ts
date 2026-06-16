import { Test, TestingModule } from '@nestjs/testing';
import { ContentPipelineService, PipelineInput } from '../../../src/articles/pipeline/content-pipeline.service';
import { ArticleValidationService } from '../../../src/articles/pipeline/article-validation.service';
import { NormalizationService } from '../../../src/articles/pipeline/normalization.service';
import { ArticleDeduplicationService } from '../../../src/articles/pipeline/article-deduplication.service';
import { LanguageDetectionService } from '../../../src/articles/pipeline/language-detection.service';
import { CategorizationService } from '../../../src/articles/pipeline/categorization.service';
import { DomainEventPublisher } from '../../../src/events/domain-event.publisher';
import { PrismaService } from '../../../src/prisma';

describe('ContentPipelineService', () => {
  let service: ContentPipelineService;

  const mockPrisma = {
    article: {
      create: jest.fn().mockResolvedValue({
        id: 'article-1',
        slug: 'test-article',
        title: 'Test Article',
        status: 'published',
      }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    articleCategory: {
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    category: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'cat-1', name: 'Tech', slug: 'tech' },
      ]),
    },
  };

  const mockEventPublisher = {
    publish: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentPipelineService,
        ArticleValidationService,
        NormalizationService,
        ArticleDeduplicationService,
        LanguageDetectionService,
        CategorizationService,
        { provide: DomainEventPublisher, useValue: mockEventPublisher },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ContentPipelineService>(ContentPipelineService);
  });

  const validInput: PipelineInput = {
    feedEntryId: 'fe-1',
    blogId: 'blog-1',
    title: 'Test Article Title',
    excerpt: 'This is a test article excerpt that is long enough to pass validation',
    canonicalUrl: 'https://example.com/test-article',
    featuredImageUrl: 'https://example.com/image.jpg',
    author: 'John Doe',
    language: 'en',
    categories: ['Tech', 'News'],
    publishedAt: new Date('2024-01-01T00:00:00Z'),
    importSource: 'https://example.com/feed.xml',
  };

  it('should process a valid input through the full pipeline', async () => {
    const result = await service.process(validInput);

    expect(result.validationPassed).toBe(true);
    expect(result.validationErrors).toHaveLength(0);
    expect(result.deduplicationResult).toBe('new');
    expect(result.languageDetected).toBe('en');
    expect(result.published).toBe(true);
    expect(result.articleId).toBe('article-1');
  });

  it('should reject invalid inputs', async () => {
    const result = await service.process({
      ...validInput,
      title: '',
      canonicalUrl: '',
    });

    expect(result.validationPassed).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(result.published).toBe(false);
  });

  it('should detect duplicates', async () => {
    mockPrisma.article.findFirst.mockResolvedValueOnce({ id: 'existing-1' });

    const result = await service.process(validInput);
    expect(result.deduplicationResult).toContain('duplicate');
    expect(result.published).toBe(false);
  });

  it('should detect language', async () => {
    const result = await service.process({
      ...validInput,
      language: null,
    });
    expect(result.languageDetected).toBeTruthy();
    expect(result.languageConfidence).toBeDefined();
  });

  it('should normalize content', async () => {
    const result = await service.process({
      ...validInput,
      title: '  Messy   Title  ',
    });
    expect(result.validationPassed).toBe(true);
  });

  it('should publish events on success', async () => {
    mockPrisma.article.findFirst.mockResolvedValue(null);
    await service.process(validInput);
    expect(mockEventPublisher.publish).toHaveBeenCalled();
  });
});
