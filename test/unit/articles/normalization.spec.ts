import { NormalizationService } from '../../../src/articles/pipeline/normalization.service';

describe('NormalizationService', () => {
  let service: NormalizationService;

  beforeAll(() => {
    service = new NormalizationService();
  });

  it('should normalize title', () => {
    const result = service.normalize({ title: '  Hello   World  ' });
    expect(result.title).toBe('Hello World');
  });

  it('should strip HTML from excerpt', () => {
    const result = service.normalize({ excerpt: '<p>Hello <b>World</b></p>' });
    expect(result.excerpt).toBe('Hello World');
  });

  it('should normalize URL', () => {
    const result = service.normalize({ canonicalUrl: 'HTTPS://Example.com/Path/' });
    expect(result.normalizedUrl).toBe('https://example.com/path');
    expect(result.urlHash).toBeDefined();
    expect(result.urlHash.length).toBe(64);
  });

  it('should normalize author name', () => {
    const result = service.normalize({ author: '  John   Doe  ' });
    expect(result.author).toBe('John Doe');
  });

  it('should lowercase language', () => {
    const result = service.normalize({ language: 'EN' });
    expect(result.language).toBe('en');
  });

  it('should default to English', () => {
    const result = service.normalize({});
    expect(result.language).toBe('en');
  });

  it('should normalize categories', () => {
    const result = service.normalize({ categories: ['  Tech  ', '  News  '] });
    expect(result.categories).toEqual(['Tech', 'News']);
  });

  it('should track changes', () => {
    const result = service.normalize({
      title: '  Trimmed Title  ',
      canonicalUrl: 'https://example.com/',
    });
    expect(result.changes.length).toBeGreaterThan(0);
  });

  it('should handle empty title', () => {
    const result = service.normalize({});
    expect(result.title).toBe('Untitled');
  });

  it('should handle null publishedAt', () => {
    const result = service.normalize({ publishedAt: null });
    expect(result.publishedAt).toBeNull();
  });

  it('should parse valid publishedAt', () => {
    const result = service.normalize({ publishedAt: '2024-01-01T00:00:00Z' });
    expect(result.publishedAt).toBeInstanceOf(Date);
  });

  it('should handle invalid publishedAt', () => {
    const result = service.normalize({ publishedAt: 'invalid' });
    expect(result.publishedAt).toBeNull();
  });
});
