import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class SitemapService {
  private readonly baseUrl: string;

  constructor(private readonly prisma: PrismaService) {
    this.baseUrl = 'https://millionblogs.com';
  }

  async generateMainSitemap(): Promise<string> {
    const now = new Date().toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${this.baseUrl}/sitemap/articles.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${this.baseUrl}/sitemap/blogs.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${this.baseUrl}/sitemap/categories.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${this.baseUrl}/sitemap/languages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
  }

  async generateArticleSitemap(): Promise<string> {
    const articles = await this.prisma.article.findMany({
      where: { status: 'published', deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take: 50000,
      select: {
        slug: true,
        updatedAt: true,
        blog: { select: { slug: true } },
      },
    });

    const urls = articles
      .map(
        (a: any) => `  <url>
    <loc>${this.baseUrl}/article/${a.blog?.slug || 'unknown'}/${a.slug}</loc>
    <lastmod>${a.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  async generateBlogSitemap(): Promise<string> {
    const blogs = await this.prisma.blog.findMany({
      where: { status: { in: ['verified', 'public'] }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { slug: true, updatedAt: true },
    });

    const urls = blogs
      .map(
        (b: any) => `  <url>
    <loc>${this.baseUrl}/blog/${b.slug}</loc>
    <lastmod>${b.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  async generateCategorySitemap(): Promise<string> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, updatedAt: true },
    });

    const urls = categories
      .map(
        (c: any) => `  <url>
    <loc>${this.baseUrl}/category/${c.slug}</loc>
    <lastmod>${c.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  async generateLanguageSitemap(): Promise<string> {
    const languages = [
      'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ru', 'ja', 'ko',
      'zh', 'ar', 'hi', 'tr', 'pl', 'sv', 'da', 'fi', 'nb', 'cs',
      'hu', 'ro', 'uk', 'el', 'he', 'th', 'vi',
    ];

    const urls = languages
      .map(
        (lang) => `  <url>
    <loc>${this.baseUrl}/language/${lang}</loc>
    <changefreq>daily</changefreq>
    <priority>0.5</priority>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }
}
