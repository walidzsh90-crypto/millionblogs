import { Test, TestingModule } from '@nestjs/testing';
import { BlogsService } from '../../../src/blogs/blogs.service';
import { BlogsRepository } from '../../../src/blogs/blogs.repository';
import { AuditService } from '../../../src/audit/audit.service';
import { ActivityService } from '../../../src/activity/activity.service';
import { DomainEventPublisher } from '../../../src/events/domain-event.publisher';
import { PrismaService } from '../../../src/prisma';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateBlogDto } from '../../../src/blogs/dto/create-blog.dto';
import { UpdateBlogDto } from '../../../src/blogs/dto/update-blog.dto';

describe('BlogsService', () => {
  let service: BlogsService;
  let repository: BlogsRepository;

  const mockUser = { id: 'user-1' };

  const mockBlog = {
    id: 'blog-1',
    userId: 'user-1',
    name: 'Test Blog',
    slug: 'test-blog',
    description: 'A test blog description',
    url: 'https://testblog.com',
    faviconUrl: null,
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
    user: { id: 'user-1', displayName: 'Test User', email: 'test@example.com' },
  };

  const mockPrisma = {
    blog: {
      create: jest.fn().mockResolvedValue(mockBlog),
      findFirst: jest.fn().mockResolvedValue(mockBlog),
      findMany: jest.fn().mockResolvedValue([mockBlog]),
      update: jest.fn().mockResolvedValue(mockBlog),
      count: jest.fn().mockResolvedValue(1),
    },
    blogCategory: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    blogLanguage: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    slugHistory: {
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    blogVerification: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    category: {
      findFirst: jest.fn().mockResolvedValue({ id: 'cat-1', slug: 'tech', name: 'Technology' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    activityLog: { create: jest.fn().mockResolvedValue({}) },
    event: {
      create: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogsService,
        BlogsRepository,
        AuditService,
        ActivityService,
        DomainEventPublisher,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BlogsService>(BlogsService);
    repository = module.get<BlogsRepository>(BlogsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a blog', async () => {
      const dto: CreateBlogDto = {
        name: 'Test Blog',
        url: 'https://testblog.com',
        description: 'A test blog description',
        primaryLanguage: 'en',
      };

      const result = await service.create(mockUser.id, dto);
      expect(result.name).toBe('Test Blog');
      expect(result.slug).toBe('test-blog');
    });

    it('should throw on duplicate URL', async () => {
      jest.spyOn(repository, 'findByUrl').mockResolvedValueOnce(mockBlog as any);

      const dto: CreateBlogDto = {
        name: 'Test Blog',
        url: 'https://testblog.com',
        primaryLanguage: 'en',
      };

      await expect(service.create(mockUser.id, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should find a blog by id', async () => {
      const result = await service.findById('blog-1');
      expect(result.id).toBe('blog-1');
    });

    it('should throw if not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValueOnce(null as any);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should find a blog by slug', async () => {
      const result = await service.findBySlug('test-blog');
      expect(result.slug).toBe('test-blog');
    });

    it('should throw if not found', async () => {
      jest.spyOn(repository, 'findBySlug').mockResolvedValueOnce(null as any);
      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUser', () => {
    it('should return user blogs', async () => {
      const result = await service.findByUser('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update a blog', async () => {
      const dto: UpdateBlogDto = { description: 'Updated description' };
      const result = await service.update('user-1', 'blog-1', dto);
      expect(result).toBeDefined();
    });

    it('should throw on non-owned blog', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValueOnce({ ...mockBlog, userId: 'other-user' } as any);
      const dto: UpdateBlogDto = { description: 'Updated' };
      await expect(service.update('user-1', 'blog-1', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a blog', async () => {
      await expect(service.softDelete('user-1', 'blog-1')).resolves.not.toThrow();
    });

    it('should throw on non-owned blog', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValueOnce({ ...mockBlog, userId: 'other-user' } as any);
      await expect(service.softDelete('user-1', 'blog-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('list', () => {
    it('should return paginated results', async () => {
      const result = await service.list({ page: 1, pageSize: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return status counts', async () => {
      const result = await service.getStats();
      expect(result).toHaveProperty('draft');
      expect(result).toHaveProperty('pendingVerification');
      expect(result).toHaveProperty('verified');
    });
  });
});
