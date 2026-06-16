import { SitemapService } from '../../../src/seo/sitemap/sitemap.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../src/prisma';

describe('SitemapService', () => {
  let service: SitemapService;

  const mockPrisma = {
    article: {
      count: jest.fn().mockResolvedValue(100),
      findMany: jest.fn().mockResolvedValue([
        {
          slug: 'test-article',
          updatedAt: new Date('2024-01-01'),
          blog: { slug: 'test-blog' },
        },
      ]),
    },
    blog: {
      count: jest.fn().mockResolvedValue(10),
      findMany: jest.fn().mockResolvedValue([
        { slug: 'test-blog', updatedAt: new Date('2024-01-01') },
      ]),
    },
    category: {
      count: jest.fn().mockResolvedValue(5),
      findMany: jest.fn().mockResolvedValue([
        { slug: 'tech', updatedAt: new Date('2024-01-01') },
      ]),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitemapService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SitemapService>(SitemapService);
  });

  it('should generate main sitemap index', async () => {
    const xml = await service.generateMainSitemap();
    expect(xml).toContain('<?xml');
    expect(xml).toContain('sitemapindex');
    expect(xml).toContain('sitemap/articles.xml');
    expect(xml).toContain('sitemap/blogs.xml');
    expect(xml).toContain('sitemap/categories.xml');
    expect(xml).toContain('sitemap/languages.xml');
  });

  it('should generate article sitemap', async () => {
    const xml = await service.generateArticleSitemap();
    expect(xml).toContain('<?xml');
    expect(xml).toContain('urlset');
    expect(xml).toContain('test-blog/test-article');
    expect(xml).toContain('weekly');
    expect(xml).toContain('0.8');
  });

  it('should generate blog sitemap', async () => {
    const xml = await service.generateBlogSitemap();
    expect(xml).toContain('<?xml');
    expect(xml).toContain('urlset');
    expect(xml).toContain('test-blog');
    expect(xml).toContain('daily');
    expect(xml).toContain('0.9');
  });

  it('should generate category sitemap', async () => {
    const xml = await service.generateCategorySitemap();
    expect(xml).toContain('<?xml');
    expect(xml).toContain('urlset');
    expect(xml).toContain('tech');
    expect(xml).toContain('0.6');
  });

  it('should generate language sitemap', async () => {
    const xml = await service.generateLanguageSitemap();
    expect(xml).toContain('<?xml');
    expect(xml).toContain('urlset');
    expect(xml).toContain('language/en');
    expect(xml).toContain('language/es');
    expect(xml).toContain('language/fr');
    expect(xml).toContain('0.5');
  });
});
