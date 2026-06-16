import { Test, TestingModule } from '@nestjs/testing';
import { BlogsRepository } from '../../../src/blogs/blogs.repository';
import { PrismaService } from '../../../src/prisma';

describe('BlogsRepository', () => {
  let repository: BlogsRepository;

  const mockBlog = {
    id: 'blog-1',
    userId: 'user-1',
    name: 'Test Blog',
    slug: 'test-blog',
    url: 'https://testblog.com',
    description: 'A test blog',
    primaryLanguage: 'en',
    status: 'draft',
    trustStatus: 'new',
    verifiedAt: null,
    visibility: 'public',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    categories: [],
    languages: [],
    user: { id: 'user-1', displayName: 'Test', email: 'test@example.com' },
  };

  const mockPrisma = {
    blog: {
      create: jest.fn().mockResolvedValue(mockBlog),
      findFirst: jest.fn().mockResolvedValue(mockBlog),
      findMany: jest.fn().mockResolvedValue([mockBlog]),
      update: jest.fn().mockResolvedValue(mockBlog),
      count: jest.fn().mockResolvedValue(5),
    },
    blogCategory: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    blogLanguage: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    slugHistory: {
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    blogVerification: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    category: {
      findFirst: jest.fn().mockResolvedValue({ id: 'cat-1', slug: 'tech', name: 'Technology' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<BlogsRepository>(BlogsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a blog', async () => {
    const result = await repository.create({
      userId: 'user-1',
      name: 'Test Blog',
      slug: 'test-blog',
      url: 'https://testblog.com',
      primaryLanguage: 'en',
    });
    expect(result.id).toBe('blog-1');
  });

  it('should find by id', async () => {
    const result = await repository.findById('blog-1');
    expect(result?.id).toBe('blog-1');
  });

  it('should find by slug', async () => {
    const result = await repository.findBySlug('test-blog');
    expect(result?.slug).toBe('test-blog');
  });

  it('should find by URL', async () => {
    const result = await repository.findByUrl('https://testblog.com');
    expect(result?.url).toBe('https://testblog.com');
  });

  it('should find by user id', async () => {
    const result = await repository.findByUserId('user-1');
    expect(result).toHaveLength(1);
  });

  it('should update a blog', async () => {
    const result = await repository.update('blog-1', { name: 'Updated' });
    expect(result.name).toBe('Test Blog');
  });

  it('should soft delete a blog', async () => {
    const result = await repository.softDelete('blog-1');
    expect(result.status).toBe('archived');
  });

  it('should restore a blog', async () => {
    const result = await repository.restore('blog-1');
    expect(result.status).toBe('draft');
  });

  it('should count by status', async () => {
    const count = await repository.countByStatus('draft');
    expect(count).toBe(5);
  });

  it('should find many with filters', async () => {
    const result = await repository.findMany({ page: 1, pageSize: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(5);
  });

  it('should set categories', async () => {
    await expect(repository.setCategories('blog-1', ['cat-1', 'cat-2'])).resolves.not.toThrow();
  });

  it('should set languages', async () => {
    await expect(repository.setLanguages('blog-1', ['en', 'es'])).resolves.not.toThrow();
  });

  it('should find verifications', async () => {
    const result = await repository.findVerifications('blog-1');
    expect(result).toEqual([]);
  });
});
