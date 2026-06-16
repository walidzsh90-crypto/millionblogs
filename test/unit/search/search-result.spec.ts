import { SearchResultDto } from '../../../src/search/dto/search-result.dto';

describe('SearchResultDto', () => {
  const mockArticle = {
    id: 'article-1',
    title: 'Test Article',
    excerpt: 'Test excerpt for article',
    slug: 'test-article',
    language: 'en',
    publishedAt: new Date('2024-01-01'),
    categories: [{ category: { name: 'Tech' } }, { category: { name: 'News' } }],
    blog: { name: 'Test Blog', slug: 'test-blog' },
    blogId: 'blog-1',
  };

  const mockBlog = {
    id: 'blog-1',
    name: 'Test Blog',
    description: 'A test blog description',
    slug: 'test-blog',
    primaryLanguage: 'en',
    createdAt: new Date('2024-01-01'),
    categories: [{ category: { name: 'Tech' } }],
  };

  it('should map article to search result', () => {
    const result = SearchResultDto.fromArticle(mockArticle, 0.95);
    expect(result.type).toBe('article');
    expect(result.title).toBe('Test Article');
    expect(result.url).toBe('/article/test-blog/test-article');
    expect(result.blogName).toBe('Test Blog');
    expect(result.categories).toContain('Tech');
    expect(result.rank).toBe(0.95);
  });

  it('should map blog to search result', () => {
    const result = SearchResultDto.fromBlog(mockBlog, 0.8);
    expect(result.type).toBe('blog');
    expect(result.title).toBe('Test Blog');
    expect(result.url).toBe('/blog/test-blog');
    expect(result.categories).toContain('Tech');
    expect(result.rank).toBe(0.8);
  });

  it('should truncate excerpt to 300 chars', () => {
    const longExcerpt = 'x'.repeat(500);
    const result = SearchResultDto.fromArticle(
      { ...mockArticle, excerpt: longExcerpt },
      1,
    );
    expect(result.excerpt!.length).toBeLessThanOrEqual(300);
  });

  it('should handle missing categories', () => {
    const result = SearchResultDto.fromArticle(
      { ...mockArticle, categories: [] },
      1,
    );
    expect(result.categories).toEqual([]);
  });

  it('should handle null blog', () => {
    const result = SearchResultDto.fromArticle(
      { ...mockArticle, blog: null },
      1,
    );
    expect(result.blogName).toBeNull();
    expect(result.blogSlug).toBeNull();
  });
});
