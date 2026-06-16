import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ArticleFilterDto } from './dto/article-filter.dto';

@Injectable()
export class ArticlesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    blogId: string;
    slug: string;
    title: string;
    excerpt?: string;
    canonicalUrl: string;
    normalizedUrl: string;
    urlHash: string;
    featuredImageUrl?: string;
    author?: string;
    language: string;
    languageConfidence?: number;
    publishedAt?: Date;
    status: string;
    source?: string;
    importSource?: string;
    feedEntryId?: string;
  }) {
    return this.prisma.article.create({
      data,
      include: {
        categories: { include: { category: true } },
        blog: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.article.findFirst({
      where: { id, deletedAt: null },
      include: {
        categories: { include: { category: true } },
        blog: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async findBySlug(blogSlug: string, articleSlug: string) {
    return this.prisma.article.findFirst({
      where: {
        slug: articleSlug,
        blog: { slug: blogSlug, deletedAt: null },
        deletedAt: null,
      },
      include: {
        categories: { include: { category: true } },
        blog: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async findMany(filter: ArticleFilterDto) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.language) where.language = filter.language;
    if (filter.blogId) where.blogId = filter.blogId;
    if (filter.public) where.status = 'published';
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { excerpt: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.categorySlug) {
      where.categories = {
        some: { category: { slug: filter.categorySlug } },
      };
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where: where as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { publishedAt: 'desc' },
        include: {
          categories: { include: { category: true } },
          blog: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.article.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async findByBlogId(blogId: string) {
    return this.prisma.article.findMany({
      where: { blogId, deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      include: {
        categories: { include: { category: true } },
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.article.update({
      where: { id },
      data,
      include: {
        categories: { include: { category: true } },
        blog: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.article.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'archived' },
    });
  }

  async setCategories(articleId: string, categoryIds: string[]) {
    await this.prisma.articleCategory.deleteMany({ where: { articleId } });
    if (categoryIds.length > 0) {
      await this.prisma.articleCategory.createMany({
        data: categoryIds.map((categoryId) => ({ articleId, categoryId })),
      });
    }
  }

  async incrementViews(id: string) {
    return this.prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async incrementClicks(id: string) {
    return this.prisma.article.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    });
  }

  async getStats() {
    const [total, drafts, processing, published, rejected, archived, views, clicks] = await Promise.all([
      this.prisma.article.count({ where: { deletedAt: null } }),
      this.prisma.article.count({ where: { status: 'draft', deletedAt: null } }),
      this.prisma.article.count({ where: { status: 'processing', deletedAt: null } }),
      this.prisma.article.count({ where: { status: 'published', deletedAt: null } }),
      this.prisma.article.count({ where: { status: 'rejected', deletedAt: null } }),
      this.prisma.article.count({ where: { status: 'archived', deletedAt: null } }),
      this.prisma.article.aggregate({ _sum: { viewCount: true }, where: { deletedAt: null } }),
      this.prisma.article.aggregate({ _sum: { clickCount: true }, where: { deletedAt: null } }),
    ]);

    const totalViews = views._sum.viewCount || 0;
    const totalClicks = clicks._sum.clickCount || 0;

    const languages = await this.prisma.article.groupBy({
      by: ['language'],
      _count: { language: true },
      where: { deletedAt: null },
    });

    const languageMap: Record<string, number> = {};
    for (const l of languages) {
      languageMap[l.language] = l._count.language;
    }

    return {
      total,
      drafts,
      processing,
      published,
      rejected,
      archived,
      totalViews,
      totalClicks,
      averageCtr: totalViews > 0 ? totalClicks / totalViews : 0,
      languages: languageMap,
    };
  }
}
