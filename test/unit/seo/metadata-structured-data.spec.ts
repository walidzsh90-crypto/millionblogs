import { MetadataService } from '../../../src/seo/metadata.service';
import { StructuredDataService } from '../../../src/seo/structured-data.service';

describe('MetadataService', () => {
  let service: MetadataService;

  beforeAll(() => {
    service = new MetadataService();
  });

  it('should generate article metadata', () => {
    const metadata = service.generateArticleMetadata({
      title: 'Test Article',
      excerpt: 'Test excerpt',
      canonicalUrl: 'https://millionblogs.com/article/blog/article',
      featuredImageUrl: 'https://example.com/image.jpg',
      language: 'en',
      author: 'John Doe',
      publishedAt: new Date('2024-01-01'),
      blogName: 'Test Blog',
    });

    expect(metadata.title).toBe('Test Article | Test Blog');
    expect(metadata.canonicalUrl).toBe('https://millionblogs.com/article/blog/article');
    expect(metadata.ogImage).toBe('https://example.com/image.jpg');
    expect(metadata.ogType).toBe('article');
    expect(metadata.twitterCard).toBe('summary_large_image');
    expect(metadata.noindex).toBe(false);
  });

  it('should generate blog metadata', () => {
    const metadata = service.generateBlogMetadata({
      name: 'My Blog',
      description: 'A great blog',
      canonicalUrl: 'https://millionblogs.com/blog/my-blog',
      language: 'en',
      articleCount: 50,
    });

    expect(metadata.title).toBe('My Blog | MillionBlogs');
    expect(metadata.ogType).toBe('website');
    expect(metadata.twitterCard).toBe('summary');
  });

  it('should generate home metadata', () => {
    const metadata = service.generateHomeMetadata();
    expect(metadata.title).toContain('MillionBlogs');
    expect(metadata.canonicalUrl).toBe('https://millionblogs.com');
    expect(metadata.ogType).toBe('website');
  });

  it('should fallback excerpt to blog name', () => {
    const metadata = service.generateArticleMetadata({
      title: 'Test',
      excerpt: null,
      canonicalUrl: 'https://millionblogs.com/article/b/n',
      featuredImageUrl: null,
      language: 'en',
      author: null,
      publishedAt: null,
      blogName: 'My Blog',
    });

    expect(metadata.description).toContain('My Blog');
  });
});

describe('StructuredDataService', () => {
  let service: StructuredDataService;

  beforeAll(() => {
    service = new StructuredDataService();
  });

  it('should generate Article schema', () => {
    const schema: any = service.generateArticleSchema({
      title: 'Test Article',
      excerpt: 'Test excerpt',
      url: 'https://millionblogs.com/article/blog/article',
      featuredImageUrl: 'https://example.com/image.jpg',
      author: 'John Doe',
      publishedAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      blogName: 'Test Blog',
      blogUrl: 'https://millionblogs.com/blog/test-blog',
      language: 'en',
    });

    expect(schema['@type']).toBe('Article');
    expect(schema.headline).toBe('Test Article');
    expect(schema.author['@type']).toBe('Person');
    expect(schema.author.name).toBe('John Doe');
    expect(schema.inLanguage).toBe('en');
  });

  it('should generate Blog schema', () => {
    const schema: any = service.generateBlogSchema({
      name: 'Test Blog',
      description: 'A test blog',
      url: 'https://millionblogs.com/blog/test-blog',
      language: 'en',
    });

    expect(schema['@type']).toBe('Blog');
    expect(schema.name).toBe('Test Blog');
    expect(schema.publisher['@type']).toBe('Organization');
  });

  it('should generate Breadcrumb schema', () => {
    const schema: any = service.generateBreadcrumbSchema([
      { name: 'Home', url: 'https://millionblogs.com' },
      { name: 'Blog', url: 'https://millionblogs.com/blog/test' },
      { name: 'Article', url: 'https://millionblogs.com/article/test/article' },
    ]);

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[0].name).toBe('Home');
  });

  it('should generate Organization schema', () => {
    const schema = service.generateOrganizationSchema();
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('MillionBlogs');
  });

  it('should handle null author as organization', () => {
    const schema: any = service.generateArticleSchema({
      title: 'Test',
      excerpt: null,
      url: 'https://millionblogs.com/article/b/a',
      featuredImageUrl: null,
      author: null,
      publishedAt: null,
      updatedAt: new Date(),
      blogName: 'Test Blog',
      blogUrl: 'https://millionblogs.com/blog/b',
      language: 'en',
    });

    expect(schema.author['@type']).toBe('Organization');
    expect(schema.author.name).toBe('Test Blog');
  });
});
