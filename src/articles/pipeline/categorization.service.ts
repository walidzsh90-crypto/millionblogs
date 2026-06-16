import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

export interface CategorizationResult {
  categoryIds: string[];
  source: 'rss' | 'blog' | 'manual' | 'none';
}

@Injectable()
export class CategorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async categorize(
    blogId: string,
    rssCategories: string[],
    providedCategoryIds: string[],
  ): Promise<CategorizationResult> {
    // Priority 1: Use manually provided category IDs
    if (providedCategoryIds.length > 0) {
      const valid = await this.validateCategoryIds(providedCategoryIds);
      if (valid.length > 0) {
        return { categoryIds: valid, source: 'manual' };
      }
    }

    // Priority 2: Match RSS categories to existing categories
    if (rssCategories.length > 0) {
      const matched = await this.matchRssToCategories(rssCategories);
      if (matched.length > 0) {
        return { categoryIds: matched, source: 'rss' };
      }
    }

    // Priority 3: Use blog's default categories
    const blogCategories = await this.getBlogCategories(blogId);
    if (blogCategories.length > 0) {
      return { categoryIds: blogCategories, source: 'blog' };
    }

    return { categoryIds: [], source: 'none' };
  }

  private async validateCategoryIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids }, isActive: true, deletedAt: null },
      select: { id: true },
    });
    const validIds = new Set(categories.map((c: any) => c.id));
    return ids.filter((id) => validIds.has(id));
  }

  private async matchRssToCategories(rssCategories: string[]): Promise<string[]> {
    const allCategories = await this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, slug: true },
    });

    const matched: string[] = [];
    const rssLower = rssCategories.map((c) => c.toLowerCase().trim());

    for (const category of allCategories) {
      const nameLower = category.name.toLowerCase().trim();
      const slugLower = category.slug.toLowerCase().trim();
      if (
        rssLower.includes(nameLower) ||
        rssLower.includes(slugLower) ||
        rssLower.some((rss) => nameLower.includes(rss) || rss.includes(nameLower))
      ) {
        matched.push(category.id);
      }
    }

    return matched;
  }

  private async getBlogCategories(blogId: string): Promise<string[]> {
    const blogCategories = await this.prisma.blogCategory.findMany({
      where: { blogId },
      select: { categoryId: true },
      take: 5,
    });
    return blogCategories.map((bc: any) => bc.categoryId);
  }
}
