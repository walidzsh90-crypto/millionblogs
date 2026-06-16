import { ArticleValidationService } from '../../../src/articles/pipeline/article-validation.service';

describe('ArticleValidationService', () => {
  let service: ArticleValidationService;

  beforeAll(() => {
    service = new ArticleValidationService();
  });

  it('should validate a valid article', () => {
    const result = service.validate({
      title: 'Test Article Title',
      canonicalUrl: 'https://example.com/article',
      publishedAt: '2024-01-01T00:00:00Z',
      language: 'en',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing title', () => {
    const result = service.validate({
      title: '',
      canonicalUrl: 'https://example.com/article',
      language: 'en',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  it('should reject missing URL', () => {
    const result = service.validate({
      title: 'Test Article',
      canonicalUrl: '',
      language: 'en',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Canonical URL is required');
  });

  it('should reject invalid URL', () => {
    const result = service.validate({
      title: 'Test Article',
      canonicalUrl: 'not-a-url',
      language: 'en',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Canonical URL is not a valid URL');
  });

  it('should warn on invalid date', () => {
    const result = service.validate({
      title: 'Test Article',
      canonicalUrl: 'https://example.com/article',
      publishedAt: 'invalid-date',
      language: 'en',
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should warn on unknown language', () => {
    const result = service.validate({
      title: 'Test Article',
      canonicalUrl: 'https://example.com/article',
      language: 'xx',
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Unrecognized language code: xx');
  });

  it('should validate for publication with minimum requirements', () => {
    const result = service.validateForPublication({
      title: 'Valid',
      canonicalUrl: 'https://example.com/article',
      language: 'en',
      excerpt: 'A reasonable excerpt for publication that is long enough',
    });
    expect(result.valid).toBe(true);
  });

  it('should reject publication with too-short title', () => {
    const result = service.validateForPublication({
      title: 'A',
      canonicalUrl: 'https://example.com/article',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title must be at least 2 characters for publication');
  });
});
