import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { ArticleValidationService } from './article-validation.service';
import { NormalizationService } from './normalization.service';
import { ArticleDeduplicationService } from './article-deduplication.service';
import { LanguageDetectionService } from './language-detection.service';
import { CategorizationService } from './categorization.service';
import { DomainEventPublisher } from '../../events';
import { EventName } from '../../events/event-names';
import { v4 as uuidv4 } from 'uuid';

export interface PipelineInput {
  feedEntryId: string;
  blogId: string;
  title: string;
  excerpt: string | null;
  canonicalUrl: string;
  featuredImageUrl: string | null;
  author: string | null;
  language: string | null;
  categories: string[];
  publishedAt: Date | null;
  importSource: string;
}

export interface PipelineOutput {
  articleId: string;
  slug: string;
  status: string;
  validationPassed: boolean;
  validationErrors: string[];
  normalizationApplied: string[];
  deduplicationResult: string;
  languageDetected: string;
  languageConfidence: number | null;
  categoriesAssigned: string[];
  published: boolean;
}

@Injectable()
export class ContentPipelineService {
  private readonly logger = new Logger(ContentPipelineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: ArticleValidationService,
    private readonly normalization: NormalizationService,
    private readonly deduplication: ArticleDeduplicationService,
    private readonly languageDetection: LanguageDetectionService,
    private readonly categorization: CategorizationService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async process(input: PipelineInput): Promise<PipelineOutput> {
    this.logger.log(`Processing pipeline for: ${input.title} (blog: ${input.blogId})`);

    // Step 1: Validation
    const validationResult = this.validation.validateForPublication({
      title: input.title,
      canonicalUrl: input.canonicalUrl,
      language: input.language || undefined,
      excerpt: input.excerpt ?? undefined,
    });

    if (!validationResult.valid) {
      this.logger.warn(`Validation failed for ${input.title}: ${validationResult.errors.join('; ')}`);
      return {
        articleId: '',
        slug: '',
        status: 'rejected',
        validationPassed: false,
        validationErrors: validationResult.errors,
        normalizationApplied: [],
        deduplicationResult: 'none',
        languageDetected: 'en',
        languageConfidence: null,
        categoriesAssigned: [],
        published: false,
      };
    }

    // Step 2: Normalization
    const normalized = this.normalization.normalize({
      title: input.title,
      excerpt: input.excerpt,
      canonicalUrl: input.canonicalUrl,
      featuredImageUrl: input.featuredImageUrl,
      author: input.author,
      language: input.language || undefined,
      categories: input.categories,
      publishedAt: input.publishedAt,
    });

    // Step 3: Deduplication
    const dedupResult = await this.deduplication.check(
      normalized.canonicalUrl,
      normalized.normalizedUrl,
      normalized.urlHash,
      input.feedEntryId,
    );

    if (dedupResult.isDuplicate) {
      this.logger.log(`Duplicate detected for ${input.title}: ${dedupResult.matchField}`);
      return {
        articleId: dedupResult.existingArticleId || '',
        slug: '',
        status: 'published',
        validationPassed: true,
        validationErrors: [],
        normalizationApplied: normalized.changes,
        deduplicationResult: `duplicate_${dedupResult.matchField}`,
        languageDetected: normalized.language,
        languageConfidence: null,
        categoriesAssigned: [],
        published: false,
      };
    }

    // Step 4: Language detection
    const langResult = this.languageDetection.detect(
      normalized.title,
      normalized.excerpt,
      input.language,
    );

    // Step 5: Categorization
    const catResult = await this.categorization.categorize(
      input.blogId,
      normalized.categories,
      [],
    );

    // Step 6: Generate slug
    const slug = await this.generateSlug(normalized.title, input.blogId);

    // Step 7: Create article
    const article = await this.prisma.article.create({
      data: {
        blogId: input.blogId,
        feedEntryId: input.feedEntryId,
        slug,
        title: normalized.title,
        excerpt: normalized.excerpt,
        canonicalUrl: normalized.canonicalUrl,
        normalizedUrl: normalized.normalizedUrl,
        urlHash: normalized.urlHash,
        featuredImageUrl: normalized.featuredImageUrl,
        author: normalized.author,
        language: langResult.language,
        languageConfidence: langResult.confidence,
        publishedAt: normalized.publishedAt,
        status: 'published',
        source: 'rss',
        importSource: input.importSource,
      },
    });

    // Assign categories
    if (catResult.categoryIds.length > 0) {
      await this.prisma.articleCategory.createMany({
        data: catResult.categoryIds.map((categoryId) => ({
          articleId: article.id,
          categoryId,
        })),
      });
    }

    // Step 8: Emit events
    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.ARTICLE_CREATED,
      aggregateId: article.id,
      aggregateType: 'article',
      payload: {
        articleId: article.id,
        blogId: input.blogId,
        title: normalized.title,
        source: 'rss',
      },
      occurredAt: new Date(),
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.ARTICLE_PUBLISHED,
      aggregateId: article.id,
      aggregateType: 'article',
      payload: {
        articleId: article.id,
        blogId: input.blogId,
        title: normalized.title,
        slug,
        language: langResult.language,
      },
      occurredAt: new Date(),
    });

    this.logger.log(`Pipeline complete: article ${article.id} published`);

    return {
      articleId: article.id,
      slug,
      status: 'published',
      validationPassed: true,
      validationErrors: [],
      normalizationApplied: normalized.changes,
      deduplicationResult: 'new',
      languageDetected: langResult.language,
      languageConfidence: langResult.confidence,
      categoriesAssigned: catResult.categoryIds,
      published: true,
    };
  }

  private async generateSlug(title: string, blogId: string): Promise<string> {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 200);

    if (!slug) slug = `article-${uuidv4().slice(0, 8)}`;

    const existing = await this.prisma.article.findFirst({
      where: { slug, blogId, deletedAt: null },
    });
    if (existing) {
      slug = `${slug}-${uuidv4().slice(0, 6)}`;
    }

    return slug;
  }
}
