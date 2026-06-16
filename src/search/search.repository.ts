import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { SearchQueryDto } from './dto/search-query.dto';

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchArticles(query: SearchQueryDto): Promise<{ items: any[]; total: number }> {
    const searchTerm = query.q.trim();
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [
      `a.status = 'published'`,
      `a.deleted_at IS NULL`,
      `b.deleted_at IS NULL`,
      `b.status IN ('verified', 'public')`,
    ];
    const params: any[] = [];
    let paramIndex = 1;

    if (searchTerm) {
      params.push(searchTerm);
      conditions.push(`a.tsv_article @@ plainto_tsquery('english', $${paramIndex})`);
      paramIndex++;
    }

    if (query.language) {
      conditions.push(`a.language = $${paramIndex}`);
      params.push(query.language);
      paramIndex++;
    }

    if (query.blogSlug) {
      conditions.push(`b.slug = $${paramIndex}`);
      params.push(query.blogSlug);
      paramIndex++;
    }

    if (query.categorySlug) {
      conditions.push(`EXISTS (
        SELECT 1 FROM article_categories ac
        JOIN categories c ON c.id = ac.category_id
        WHERE ac.article_id = a.id AND c.slug = $${paramIndex}
      )`);
      params.push(query.categorySlug);
      paramIndex++;
    }

    if (query.dateFrom) {
      conditions.push(`a.published_at >= $${paramIndex}`);
      params.push(query.dateFrom);
      paramIndex++;
    }
    if (query.dateTo) {
      conditions.push(`a.published_at <= $${paramIndex}`);
      params.push(query.dateTo);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const rankExpr = searchTerm
      ? `ts_rank(a.tsv_article, plainto_tsquery('english', $1))`
      : `0::float4`;

    let orderClause: string;
    switch (query.sort) {
      case 'date':
        orderClause = 'a.published_at DESC NULLS LAST';
        break;
      case 'title':
        orderClause = 'a.title ASC';
        break;
      default:
        orderClause = `
          ${rankExpr} DESC,
          CASE b.trust_status WHEN 'featured' THEN 3 WHEN 'trusted' THEN 2 WHEN 'verified' THEN 1 ELSE 0 END DESC,
          a.published_at DESC NULLS LAST
        `;
    }

    const countSql = `
      SELECT COUNT(*) as total
      FROM articles a
      JOIN blogs b ON b.id = a.blog_id
      WHERE ${whereClause}
    `;

    const dataSql = `
      SELECT a.*, b.name as blog_name, b.slug as blog_slug, b.trust_status as blog_trust_status,
        ${rankExpr} as rank
      FROM articles a
      JOIN blogs b ON b.id = a.blog_id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    const [countResult, items] = await Promise.all([
      this.prisma.$queryRawUnsafe(countSql, ...params.slice(0, -2)) as Promise<Array<{ total: bigint }>>,
      this.prisma.$queryRawUnsafe(dataSql, ...params) as Promise<any[]>,
    ]);

    const total = Number(countResult[0]?.total || 0);

    // Fetch categories for articles
    const articleIds = items.map((i: any) => i.id);
    let categoryMap: Record<string, any[]> = {};
    if (articleIds.length > 0) {
      const categories = await this.prisma.$queryRawUnsafe(
        `SELECT ac.article_id, c.id, c.name, c.slug
         FROM article_categories ac
         JOIN categories c ON c.id = ac.category_id
         WHERE ac.article_id = ANY($1::uuid[])`,
        [articleIds],
      ) as any[];
      for (const cat of categories) {
        if (!categoryMap[cat.article_id]) categoryMap[cat.article_id] = [];
        categoryMap[cat.article_id].push({ id: cat.id, name: cat.name, slug: cat.slug });
      }
    }

    const enrichedItems = items.map((item: any) => ({
      ...item,
      categories: (categoryMap[item.id] || []).map((c: any) => ({ category: c })),
      blog: { name: item.blog_name, slug: item.blog_slug },
    }));

    return { items: enrichedItems, total };
  }

  async searchBlogs(query: SearchQueryDto): Promise<{ items: any[]; total: number }> {
    const searchTerm = query.q.trim();
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [
      `b.deleted_at IS NULL`,
      `b.status IN ('verified', 'public')`,
    ];
    const params: any[] = [];
    let paramIndex = 1;

    if (searchTerm) {
      params.push(searchTerm);
      conditions.push(`b.tsv_blog @@ plainto_tsquery('english', $${paramIndex})`);
      paramIndex++;
    }

    if (query.language) {
      conditions.push(`b.primary_language = $${paramIndex}`);
      params.push(query.language);
      paramIndex++;
    }

    if (query.categorySlug) {
      conditions.push(`EXISTS (
        SELECT 1 FROM blog_categories bc
        JOIN categories c ON c.id = bc.category_id
        WHERE bc.blog_id = b.id AND c.slug = $${paramIndex}
      )`);
      params.push(query.categorySlug);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countSql = `SELECT COUNT(*) as total FROM blogs b WHERE ${whereClause}`;

    const rankExpr = searchTerm
      ? `ts_rank(b.tsv_blog, plainto_tsquery('english', $1))`
      : `0::float4`;

    const dataSql = `
      SELECT b.*,
        ${rankExpr} as rank
      FROM blogs b
      WHERE ${whereClause}
      ORDER BY
        CASE b.trust_status WHEN 'featured' THEN 3 WHEN 'trusted' THEN 2 WHEN 'verified' THEN 1 ELSE 0 END DESC,
        rank DESC,
        b.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    const [countResult, items] = await Promise.all([
      this.prisma.$queryRawUnsafe(countSql, ...params.slice(0, -2)),
      this.prisma.$queryRawUnsafe(dataSql, ...params),
    ]) as [Array<{ total: bigint }>, any[]];

    const total = Number(countResult[0]?.total || 0);

    // Fetch categories
    const blogIds = items.map((i: any) => i.id);
    let categoryMap: Record<string, any[]> = {};
    if (blogIds.length > 0) {
      const categories = await this.prisma.$queryRawUnsafe(
        `SELECT bc.blog_id, c.id, c.name, c.slug
         FROM blog_categories bc
         JOIN categories c ON c.id = bc.category_id
         WHERE bc.blog_id = ANY($1::uuid[])`,
        [blogIds],
      ) as any[];
      for (const cat of categories) {
        if (!categoryMap[cat.blog_id]) categoryMap[cat.blog_id] = [];
        categoryMap[cat.blog_id].push({ id: cat.id, name: cat.name, slug: cat.slug });
      }
    }

    const enrichedItems = items.map((item: any) => ({
      ...item,
      categories: (categoryMap[item.id] || []).map((c: any) => ({ category: c })),
    }));

    return { items: enrichedItems, total };
  }
}
