import {
  Controller,
  Get,
  Param,
  Header,
} from '@nestjs/common';
import { SitemapService } from './sitemap/sitemap.service';
import { RobotsService } from './robots.service';
import { CanonicalService } from './canonical.service';
import { MetadataService } from './metadata.service';
import { StructuredDataService } from './structured-data.service';

@Controller()
export class SeoController {
  constructor(
    private readonly sitemapService: SitemapService,
    private readonly robotsService: RobotsService,
    private readonly canonicalService: CanonicalService,
    private readonly metadataService: MetadataService,
    private readonly structuredDataService: StructuredDataService,
  ) {}

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  async getRobots(): Promise<string> {
    return this.robotsService.generate();
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async getMainSitemap(): Promise<string> {
    return this.sitemapService.generateMainSitemap();
  }

  @Get('sitemap/articles.xml')
  @Header('Content-Type', 'application/xml')
  async getArticleSitemap(): Promise<string> {
    return this.sitemapService.generateArticleSitemap();
  }

  @Get('sitemap/blogs.xml')
  @Header('Content-Type', 'application/xml')
  async getBlogSitemap(): Promise<string> {
    return this.sitemapService.generateBlogSitemap();
  }

  @Get('sitemap/categories.xml')
  @Header('Content-Type', 'application/xml')
  async getCategorySitemap(): Promise<string> {
    return this.sitemapService.generateCategorySitemap();
  }

  @Get('sitemap/languages.xml')
  @Header('Content-Type', 'application/xml')
  async getLanguageSitemap(): Promise<string> {
    return this.sitemapService.generateLanguageSitemap();
  }

  @Get('seo/home')
  async getHomeSeo() {
    const metadata = this.metadataService.generateHomeMetadata();
    const organization = this.structuredDataService.generateOrganizationSchema();
    return { metadata, structuredData: [organization] };
  }

  @Get('seo/article/:blogSlug/:articleSlug')
  async getArticleSeo(
    @Param('blogSlug') blogSlug: string,
    @Param('articleSlug') articleSlug: string,
  ) {
    const canonicalUrl = this.canonicalService.generateArticleUrl(blogSlug, articleSlug);
    const metadata = this.metadataService.generateArticleMetadata({
      title: '',
      excerpt: null,
      canonicalUrl,
      featuredImageUrl: null,
      language: 'en',
      author: null,
      publishedAt: null,
      blogName: '',
    });
    const breadcrumb = this.structuredDataService.generateBreadcrumbSchema([
      { name: 'Home', url: this.canonicalService.generateHomeUrl() },
      { name: blogSlug, url: this.canonicalService.generateBlogUrl(blogSlug) },
      { name: articleSlug, url: canonicalUrl },
    ]);
    return { metadata, structuredData: [breadcrumb] };
  }

  @Get('seo/blog/:blogSlug')
  async getBlogSeo(@Param('blogSlug') blogSlug: string) {
    const canonicalUrl = this.canonicalService.generateBlogUrl(blogSlug);
    const metadata = this.metadataService.generateBlogMetadata({
      name: blogSlug,
      description: null,
      canonicalUrl,
      language: 'en',
      articleCount: 0,
    });
    const breadcrumb = this.structuredDataService.generateBreadcrumbSchema([
      { name: 'Home', url: this.canonicalService.generateHomeUrl() },
      { name: blogSlug, url: canonicalUrl },
    ]);
    return { metadata, structuredData: [breadcrumb] };
  }

  @Get('seo/category/:categorySlug')
  async getCategorySeo(@Param('categorySlug') categorySlug: string) {
    const canonicalUrl = this.canonicalService.generateCategoryUrl(categorySlug);
    const breadcrumb = this.structuredDataService.generateBreadcrumbSchema([
      { name: 'Home', url: this.canonicalService.generateHomeUrl() },
      { name: categorySlug, url: canonicalUrl },
    ]);
    return {
      metadata: {
        title: `${categorySlug} | MillionBlogs`,
        description: `Browse articles in the ${categorySlug} category`,
        canonicalUrl,
        noindex: false,
      },
      structuredData: [breadcrumb],
    };
  }
}
