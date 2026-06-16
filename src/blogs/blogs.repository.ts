import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { BlogFilterDto } from './dto/blog-filter.dto';

@Injectable()
export class BlogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    name: string;
    slug: string;
    url: string;
    description?: string;
    primaryLanguage: string;
    status?: string;
    trustStatus?: string;
  }) {
    return this.prisma.blog.create({ data });
  }

  async findById(id: string) {
    return this.prisma.blog.findFirst({
      where: { id, deletedAt: null },
      include: {
        categories: { include: { category: true } },
        languages: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.blog.findFirst({
      where: { slug, deletedAt: null },
      include: {
        categories: { include: { category: true } },
        languages: true,
      },
    });
  }

  async findByUrl(url: string) {
    return this.prisma.blog.findFirst({
      where: { url, deletedAt: null },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.blog.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: { include: { category: true } },
        languages: true,
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.blog.update({
      where: { id },
      data,
      include: {
        categories: { include: { category: true } },
        languages: true,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.blog.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'archived' },
    });
  }

  async restore(id: string) {
    return this.prisma.blog.update({
      where: { id },
      data: { deletedAt: null, status: 'draft' },
    });
  }

  async setCategories(blogId: string, categoryIds: string[]) {
    await this.prisma.blogCategory.deleteMany({ where: { blogId } });
    if (categoryIds.length > 0) {
      await this.prisma.blogCategory.createMany({
        data: categoryIds.map((categoryId) => ({ blogId, categoryId })),
      });
    }
  }

  async setLanguages(blogId: string, languages: string[]) {
    await this.prisma.blogLanguage.deleteMany({ where: { blogId } });
    if (languages.length > 0) {
      await this.prisma.blogLanguage.createMany({
        data: languages.map((language) => ({ blogId, language })),
      });
    }
  }

  async findSlugHistory(slug: string): Promise<boolean> {
    const existing = await this.prisma.slugHistory.findFirst({ where: { slug } });
    return !!existing;
  }

  async saveSlugHistory(blogId: string, slug: string) {
    await this.prisma.slugHistory.create({ data: { blogId, slug } });
  }

  async countByStatus(status: string) {
    return this.prisma.blog.count({ where: { status, deletedAt: null } });
  }

  async findMany(filter: BlogFilterDto) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.trustStatus) where.trustStatus = filter.trustStatus;
    if (filter.language) where.primaryLanguage = filter.language;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.blog.findMany({
        where: where as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: { include: { category: true } },
          languages: true,
          user: { select: { id: true, displayName: true, email: true } },
        },
      }),
      this.prisma.blog.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async findVerifications(blogId: string) {
    return this.prisma.blogVerification.findMany({
      where: { blogId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Category helpers
  async findCategoryById(id: string) {
    return this.prisma.category.findFirst({ where: { id, deletedAt: null } });
  }

  async findActiveCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
