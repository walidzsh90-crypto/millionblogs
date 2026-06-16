import { RobotsService } from '../../../src/seo/robots.service';
import { CanonicalService } from '../../../src/seo/canonical.service';
import { HreflangService } from '../../../src/seo/hreflang.service';

describe('RobotsService', () => {
  let service: RobotsService;

  beforeAll(() => {
    service = new RobotsService();
  });

  it('should generate robots.txt', () => {
    const robots = service.generate();
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Sitemap:');
    expect(robots).toContain('Crawl-Delay: 10');
  });
});

describe('CanonicalService', () => {
  let service: CanonicalService;

  beforeAll(() => {
    service = new CanonicalService();
  });

  it('should generate article URL', () => {
    expect(service.generateArticleUrl('my-blog', 'my-article'))
      .toBe('https://millionblogs.com/article/my-blog/my-article');
  });

  it('should generate blog URL', () => {
    expect(service.generateBlogUrl('my-blog'))
      .toBe('https://millionblogs.com/blog/my-blog');
  });

  it('should generate category URL', () => {
    expect(service.generateCategoryUrl('tech'))
      .toBe('https://millionblogs.com/category/tech');
  });

  it('should generate language URL', () => {
    expect(service.generateLanguageUrl('es'))
      .toBe('https://millionblogs.com/language/es');
  });
});

describe('HreflangService', () => {
  let service: HreflangService;

  beforeAll(() => {
    service = new HreflangService();
  });

  it('should generate hreflang tags for article', () => {
    const tags = service.generateForArticle('my-blog', 'my-article', ['en', 'es']);
    expect(tags).toHaveLength(3);
    expect(tags[0].hreflang).toBe('en');
    expect(tags[1].hreflang).toBe('es');
    expect(tags[2].hreflang).toBe('x-default');
  });

  it('should generate hreflang tags for blog', () => {
    const tags = service.generateForBlog('my-blog', ['en', 'fr']);
    expect(tags).toHaveLength(3);
    expect(tags[0].hreflang).toBe('en');
    expect(tags[1].hreflang).toBe('fr');
    expect(tags[2].hreflang).toBe('x-default');
  });
});
