import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ArticlesRepository } from './articles.repository';
import { ArticleValidationService } from './pipeline/article-validation.service';
import { NormalizationService } from './pipeline/normalization.service';
import { ArticleDeduplicationService } from './pipeline/article-deduplication.service';
import { LanguageDetectionService } from './pipeline/language-detection.service';
import { ContentPipelineService, PipelineInput } from './pipeline/content-pipeline.service';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleFilterDto } from './dto/article-filter.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { ArticleStatsDto } from './dto/article-stats.dto';
import { PipelineResultDto } from './dto/pipeline-result.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly repository: ArticlesRepository,
    private readonly validation: ArticleValidationService,
    private readonly normalization: NormalizationService,
    private readonly deduplication: ArticleDeduplicationService,
    private readonly languageDetection: LanguageDetectionService,
    private readonly pipeline: ContentPipelineService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async create(blogId: string, dto: CreateArticleDto): Promise<ArticleResponseDto> {
    const validationResult = this.validation.validate(dto);
    if (!validationResult.valid) {
      throw new BadRequestException(`Validation failed: ${validationResult.errors.join('; ')}`);
    }

    const normalized = this.normalization.normalize({
      title: dto.title,
      excerpt: dto.excerpt,
      canonicalUrl: dto.canonicalUrl,
      featuredImageUrl: dto.featuredImageUrl,
      author: dto.author,
      language: dto.language,
      categories: dto.categoryIds,
      publishedAt: dto.publishedAt,
    });

    const dedupResult = await this.deduplication.check(
      normalized.canonicalUrl,
      normalized.normalizedUrl,
      normalized.urlHash,
    );
    if (dedupResult.isDuplicate) {
      throw new BadRequestException('This article already exists (duplicate detected)');
    }

    const langResult = this.languageDetection.detect(normalized.title, normalized.excerpt, dto.language);

    const slug = await this.generateSlug(normalized.title, blogId);

    const article = await this.repository.create({
      blogId,
      slug,
      title: normalized.title,
      excerpt: normalized.excerpt ?? undefined,
      canonicalUrl: normalized.canonicalUrl,
      normalizedUrl: normalized.normalizedUrl,
      urlHash: normalized.urlHash,
      featuredImageUrl: normalized.featuredImageUrl ?? undefined,
      author: normalized.author ?? undefined,
      language: langResult.language,
      languageConfidence: langResult.confidence,
      publishedAt: normalized.publishedAt || new Date(),
      status: 'published',
      source: 'manual',
    });

    if (dto.categoryIds && dto.categoryIds.length > 0) {
      await this.repository.setCategories(article.id, dto.categoryIds);
    }

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.ARTICLE_CREATED,
      aggregateId: article.id,
      aggregateType: 'article',
      payload: { articleId: article.id, blogId, title: article.title, source: 'manual' },
      occurredAt: new Date(),
    });

    if (article.status === 'published') {
      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.ARTICLE_PUBLISHED,
        aggregateId: article.id,
        aggregateType: 'article',
        payload: { articleId: article.id, blogId, slug },
        occurredAt: new Date(),
      });
    }

    return this.findById(article.id);
  }

  async processFromPipeline(input: PipelineInput): Promise<PipelineResultDto> {
    const result = await this.pipeline.process(input);
    return PipelineResultDto.fromData(result as any);
  }

  async findById(id: string): Promise<ArticleResponseDto> {
    const article = await this.repository.findById(id);
    if (!article) throw new NotFoundException('Article not found');
    return ArticleResponseDto.fromEntity(article);
  }

  async findBySlug(blogSlug: string, articleSlug: string): Promise<ArticleResponseDto> {
    const article = await this.repository.findBySlug(blogSlug, articleSlug);
    if (!article) throw new NotFoundException('Article not found');
    await this.repository.incrementViews(article.id);
    return ArticleResponseDto.fromEntity(article);
  }

  async findByBlog(blogId: string): Promise<ArticleResponseDto[]> {
    const articles = await this.repository.findByBlogId(blogId);
    return articles.map((a: any) => ArticleResponseDto.fromEntity(a));
  }

  async list(filter: ArticleFilterDto) {
    const result = await this.repository.findMany(filter);
    return {
      ...result,
      items: result.items.map((item: any) => ArticleResponseDto.fromEntity(item)),
    };
  }

  async update(id: string, dto: UpdateArticleDto): Promise<ArticleResponseDto> {
    const article = await this.repository.findById(id);
    if (!article) throw new NotFoundException('Article not found');

    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.excerpt !== undefined) updateData.excerpt = dto.excerpt;
    if (dto.featuredImageUrl !== undefined) updateData.featuredImageUrl = dto.featuredImageUrl;
    if (dto.author !== undefined) updateData.author = dto.author;
    if (dto.language !== undefined) updateData.language = dto.language;
    if (dto.status !== undefined) updateData.status = dto.status;

    if (dto.categoryIds !== undefined) {
      await this.repository.setCategories(id, dto.categoryIds);
    }

    const updated = await this.repository.update(id, updateData);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.ARTICLE_UPDATED,
      aggregateId: id,
      aggregateType: 'article',
      payload: { articleId: id, changes: Object.keys(updateData) },
      occurredAt: new Date(),
    });

    if (dto.status === 'archived') {
      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.ARTICLE_ARCHIVED,
        aggregateId: id,
        aggregateType: 'article',
        payload: { articleId: id },
        occurredAt: new Date(),
      });
    }

    return ArticleResponseDto.fromEntity(updated);
  }

  async delete(id: string): Promise<void> {
    const article = await this.repository.findById(id);
    if (!article) throw new NotFoundException('Article not found');

    await this.repository.softDelete(id);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.ARTICLE_ARCHIVED,
      aggregateId: id,
      aggregateType: 'article',
      payload: { articleId: id, action: 'deleted' },
      occurredAt: new Date(),
    });
  }

  async getStats(): Promise<ArticleStatsDto> {
    const stats = await this.repository.getStats();
    return ArticleStatsDto.fromData(stats as any);
  }

  async recordClick(id: string): Promise<void> {
    await this.repository.incrementClicks(id);
  }

  private async generateSlug(title: string, blogId: string): Promise<string> {
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 200);

    if (!slug) slug = `article-${uuidv4().slice(0, 8)}`;

    const existing = await this.repository.findBySlug(blogId, slug).catch(() => null);
    if (existing) {
      slug = `${slug}-${uuidv4().slice(0, 6)}`;
    }

    return slug;
  }
}
