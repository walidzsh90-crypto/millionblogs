import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { FeedsRepository } from './feeds.repository';
import { FeedValidatorService } from './validation/feed-validator.service';
import { FeedParserFactory } from './parsing/feed-parser.factory';
import { DuplicateDetectionService } from './detection/duplicate-detection.service';
import { FeedHealthService } from './health/feed-health.service';
import { FeedSchedulerService } from './scheduler/feed-scheduler.service';
import { PriorityQueueService } from './scheduler/priority-queue.service';
import { RetryQueueService } from './scheduler/retry-queue.service';
import { DeadLetterQueueService } from './scheduler/dead-letter-queue.service';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { AddFeedDto } from './dto/add-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';
import { FeedFilterDto } from './dto/feed-filter.dto';
import { FeedResponseDto } from './dto/feed-response.dto';
import { FeedEntryResponseDto } from './dto/feed-entry-response.dto';
import { FeedLogResponseDto } from './dto/feed-log-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);
  private readonly syncLocks = new Map<string, Promise<any>>();

  constructor(
    private readonly repository: FeedsRepository,
    private readonly validator: FeedValidatorService,
    private readonly parserFactory: FeedParserFactory,
    private readonly duplicateDetection: DuplicateDetectionService,
    private readonly healthService: FeedHealthService,
    private readonly scheduler: FeedSchedulerService,
    private readonly priorityQueue: PriorityQueueService,
    private readonly retryQueue: RetryQueueService,
    private readonly deadLetterQueue: DeadLetterQueueService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async addFeed(blogId: string, dto: AddFeedDto): Promise<FeedResponseDto> {
    const existing = await this.repository.findByUrl(dto.url);
    if (existing) {
      throw new ConflictException('This feed URL is already registered');
    }

    const validationResult = await this.validator.validate(dto.url);
    if (!validationResult.valid) {
      throw new BadRequestException(
        `Feed validation failed: ${validationResult.errors.join('; ')}`,
      );
    }
    if (validationResult.warnings.length > 0) {
      this.logger.warn(`Feed ${dto.url} has warnings: ${validationResult.warnings.join('; ')}`);
    }

    const feed = await this.repository.create({
      blogId,
      url: dto.url,
      title: validationResult.title ?? undefined,
      description: validationResult.description ?? undefined,
      siteUrl: validationResult.siteUrl ?? undefined,
      feedType: validationResult.feedType || undefined,
      language: validationResult.language ?? undefined,
      icon: validationResult.icon ?? undefined,
      syncFrequency: dto.syncFrequency || 3600,
      status: 'active',
    });

    const syncFreq = dto.syncFrequency || 3600;
    await this.repository.update(feed.id, {
      nextSyncAt: new Date(Date.now() + syncFreq * 1000),
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.FEED_ADDED,
      aggregateId: feed.id,
      aggregateType: 'rss_feed',
      payload: { feedId: feed.id, blogId, url: dto.url, feedType: feed.feedType },
      occurredAt: new Date(),
    });

    this.scheduler.scheduleManualSync(feed.id, 10);
    return FeedResponseDto.fromEntity(feed);
  }

  async findById(id: string): Promise<FeedResponseDto> {
    const feed = await this.repository.findById(id);
    if (!feed) throw new NotFoundException('Feed not found');
    return FeedResponseDto.fromEntity(feed);
  }

  async findByBlog(blogId: string): Promise<FeedResponseDto[]> {
    const feeds = await this.repository.findByBlogId(blogId);
    return feeds.map((f: any) => FeedResponseDto.fromEntity(f));
  }

  async list(filter: FeedFilterDto) {
    const result = await this.repository.findMany(filter);
    return {
      ...result,
      items: result.items.map((item: any) => FeedResponseDto.fromEntity(item)),
    };
  }

  async update(id: string, dto: UpdateFeedDto): Promise<FeedResponseDto> {
    const feed = await this.repository.findById(id);
    if (!feed) throw new NotFoundException('Feed not found');

    const updateData: Record<string, unknown> = {};
    if (dto.url) {
      const validationResult = await this.validator.validate(dto.url);
      if (!validationResult.valid) {
        throw new BadRequestException(`Feed validation failed: ${validationResult.errors.join('; ')}`);
      }
      updateData.url = dto.url;
      if (validationResult.title) updateData.title = validationResult.title;
      if (validationResult.description) updateData.description = validationResult.description;
      if (validationResult.siteUrl) updateData.siteUrl = validationResult.siteUrl;
      if (validationResult.feedType) updateData.feedType = validationResult.feedType;
      if (validationResult.language) updateData.language = validationResult.language;
      if (validationResult.icon) updateData.icon = validationResult.icon;
    }
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.syncFrequency) {
      updateData.syncFrequency = dto.syncFrequency;
      updateData.nextSyncAt = new Date(Date.now() + dto.syncFrequency * 1000);
    }

    const updated = await this.repository.update(id, updateData);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.FEED_UPDATED,
      aggregateId: id,
      aggregateType: 'rss_feed',
      payload: { feedId: id, changes: Object.keys(updateData) },
      occurredAt: new Date(),
    });

    return FeedResponseDto.fromEntity(updated);
  }

  async disable(id: string): Promise<FeedResponseDto> {
    const feed = await this.repository.findById(id);
    if (!feed) throw new NotFoundException('Feed not found');

    const updated = await this.repository.update(id, {
      status: 'disabled',
      disabledAt: new Date(),
    });

    this.priorityQueue.remove(id);
    this.retryQueue.removeFromRetry(id);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.FEED_DISABLED,
      aggregateId: id,
      aggregateType: 'rss_feed',
      payload: { feedId: id },
      occurredAt: new Date(),
    });

    return FeedResponseDto.fromEntity(updated);
  }

  async enable(id: string): Promise<FeedResponseDto> {
    const feed = await this.repository.findById(id);
    if (!feed) throw new NotFoundException('Feed not found');

    const updated = await this.repository.update(id, {
      status: 'active',
      disabledAt: null,
    });

    this.scheduler.scheduleManualSync(id, 5);
    return FeedResponseDto.fromEntity(updated);
  }

  async pause(id: string): Promise<FeedResponseDto> {
    const feed = await this.repository.findById(id);
    if (!feed) throw new NotFoundException('Feed not found');

    const updated = await this.repository.update(id, { status: 'paused' });
    this.priorityQueue.remove(id);
    return FeedResponseDto.fromEntity(updated);
  }

  async delete(id: string): Promise<void> {
    const feed = await this.repository.findById(id);
    if (!feed) throw new NotFoundException('Feed not found');

    await this.repository.softDelete(id);
    this.priorityQueue.remove(id);
    this.retryQueue.removeFromRetry(id);
    this.deadLetterQueue.remove(id);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.FEED_DISABLED,
      aggregateId: id,
      aggregateType: 'rss_feed',
      payload: { feedId: id, action: 'deleted' },
      occurredAt: new Date(),
    });
  }

  async syncFeed(feedId: string): Promise<{
    imported: number;
    skipped: number;
    duplicates: number;
    errors: string[];
  }> {
    const existingSync = this.syncLocks.get(feedId);
    if (existingSync) {
      this.logger.warn(`Feed ${feedId} sync already in progress, waiting`);
      return existingSync;
    }

    const syncPromise = this.executeSync(feedId);
    this.syncLocks.set(feedId, syncPromise);
    try {
      return await syncPromise;
    } finally {
      this.syncLocks.delete(feedId);
    }
  }

  private async executeSync(feedId: string): Promise<{
    imported: number;
    skipped: number;
    duplicates: number;
    errors: string[];
  }> {
    const feed = await this.repository.findById(feedId);
    if (!feed) throw new NotFoundException('Feed not found');
    if (feed.status === 'disabled' || feed.status === 'archived') {
      throw new BadRequestException('Cannot sync a disabled or archived feed');
    }

    const result = { imported: 0, skipped: 0, duplicates: 0, errors: [] as string[] };
    const requestTime = new Date();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(feed.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'MillionBlogs-RSS/1.0' },
      });
      clearTimeout(timeout);
      const responseTime = new Date();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xml = await response.text();
      const feedType = this.parserFactory.detectFeedType(xml);
      const parsed = this.parserFactory.parse(xml, feedType);

      if (!feed.title && parsed.title) {
        await this.repository.update(feedId, { title: parsed.title });
      }
      if (!feed.description && parsed.description) {
        await this.repository.update(feedId, { description: parsed.description });
      }
      if (!feed.siteUrl && parsed.siteUrl) {
        await this.repository.update(feedId, { siteUrl: parsed.siteUrl });
      }
      if (!feed.icon && parsed.icon) {
        await this.repository.update(feedId, { icon: parsed.icon });
      }
      if (!feed.language && parsed.language) {
        await this.repository.update(feedId, { language: parsed.language });
      }
      if (!feed.feedType) {
        await this.repository.update(feedId, { feedType });
      }

      for (const entry of parsed.entries) {
        try {
          const duplicateCheck = await this.duplicateDetection.check(
            this.repository['prisma'],
            feedId,
            {
              feedId,
              guid: entry.guid,
              canonicalUrl: entry.canonicalUrl,
              normalizedUrl: entry.normalizedUrl,
              title: entry.title,
            },
          );

          if (duplicateCheck.isDuplicate) {
            result.duplicates++;
            continue;
          }

          const guidExists = await this.repository.findEntryByGuid(feedId, entry.guid);
          if (guidExists) {
            result.duplicates++;
            continue;
          }

          const hashExists = await this.repository.findEntryByHash(feedId, entry.urlHash);
          if (hashExists) {
            result.duplicates++;
            continue;
          }

          await this.repository.createEntry({
            feedId,
            guid: entry.guid,
            canonicalUrl: entry.canonicalUrl,
            normalizedUrl: entry.normalizedUrl,
            urlHash: entry.urlHash,
            title: entry.title,
            excerpt: entry.excerpt ?? undefined,
            imageUrl: entry.imageUrl ?? undefined,
            author: entry.author ?? undefined,
            categories: entry.categories.length > 0 ? entry.categories : undefined,
            language: entry.language || feed.language || undefined,
            publishedAt: entry.publishedAt || undefined,
          });

          await this.eventPublisher.publish({
            eventId: uuidv4(),
            eventName: EventName.ARTICLE_DISCOVERED,
            aggregateId: feedId,
            aggregateType: 'rss_feed_entry',
            payload: {
              feedId,
              entryGuid: entry.guid,
              title: entry.title,
              url: entry.canonicalUrl,
            },
            occurredAt: new Date(),
          });

          result.imported++;
        } catch (err) {
          result.errors.push(`Entry error: ${(err as Error).message}`);
          result.skipped++;
        }
      }

      const durationMs = responseTime.getTime() - requestTime.getTime();
      const newSuccessCount = feed.successCount + 1;
      const newAvgTime = feed.averageResponseTime
        ? (feed.averageResponseTime * feed.successCount + durationMs) / newSuccessCount
        : durationMs;
      const healthScore = this.healthService.calculateHealth({
        successCount: newSuccessCount,
        failureCount: feed.failureCount,
        averageResponseTime: newAvgTime,
        errorCount: feed.errorCount,
      });

      await this.repository.update(feedId, {
        status: 'active',
        lastSyncAt: new Date(),
        nextSyncAt: new Date(Date.now() + feed.syncFrequency * 1000),
        successCount: newSuccessCount,
        lastSuccessAt: new Date(),
        averageResponseTime: newAvgTime,
        healthScore,
        errorCount: 0,
        lastError: null,
      });

      await this.repository.createSyncLog({
        feedId,
        status: 'success',
        requestTime,
        responseTime,
        durationMs,
        statusCode: response.status,
        importedCount: result.imported,
        skippedCount: result.skipped,
        duplicateCount: result.duplicates,
        metadata: { itemsInFeed: parsed.entries.length },
      });

      this.retryQueue.removeFromRetry(feedId);

      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.FEED_SYNCED,
        aggregateId: feedId,
        aggregateType: 'rss_feed',
        payload: {
          feedId,
          imported: result.imported,
          skipped: result.skipped,
          duplicates: result.duplicates,
          totalItems: parsed.entries.length,
        },
        occurredAt: new Date(),
      });

      this.logger.log(`Feed ${feedId} synced: ${result.imported} imported, ${result.duplicates} duplicates, ${result.skipped} skipped`);
    } catch (err) {
      const errorMessage = (err as Error).message;
      result.errors.push(errorMessage);

      const newFailureCount = feed.failureCount + 1;
      const healthScore = this.healthService.calculateHealth({
        successCount: feed.successCount,
        failureCount: newFailureCount,
        averageResponseTime: feed.averageResponseTime,
        errorCount: feed.errorCount + 1,
      });

      await this.repository.update(feedId, {
        status: newFailureCount >= 10 ? 'failed' : 'active',
        failureCount: newFailureCount,
        lastFailureAt: new Date(),
        healthScore,
        errorCount: feed.errorCount + 1,
        lastError: errorMessage.substring(0, 500),
      });

      await this.repository.createSyncLog({
        feedId,
        status: 'failed',
        requestTime,
        responseTime: new Date(),
        error: errorMessage,
        importedCount: result.imported,
        skippedCount: result.skipped,
        duplicateCount: result.duplicates,
      });

      const retryAdded = this.retryQueue.addToRetry(feedId, errorMessage, feed.errorCount + 1, 5);
      if (!retryAdded) {
        this.deadLetterQueue.add(
          feedId,
          feed.url,
          'Exceeded max retry attempts',
          feed.errorCount + 1,
          errorMessage,
          feed.lastSuccessAt,
        );

        await this.repository.update(feedId, { status: 'failed' });

        await this.eventPublisher.publish({
          eventId: uuidv4(),
          eventName: EventName.FEED_FAILED,
          aggregateId: feedId,
          aggregateType: 'rss_feed',
          payload: { feedId, error: errorMessage, movedToDLQ: true },
          occurredAt: new Date(),
        });
      }

      this.logger.error(`Feed ${feedId} sync failed: ${errorMessage}`);
    }

    return result;
  }

  async getStats() {
    const feedStats = await this.repository.getStats();
    const entryStats = await this.repository.getEntryStats();
    const avgHealth = await this.repository.getAverageHealthScore();

    return {
      ...feedStats,
      entriesWithAuthor: entryStats.withAuthor,
      entriesWithImage: entryStats.withImage,
      entriesWithCategories: entryStats.withCategories,
      averageHealthScore: avgHealth,
    };
  }

  async getFeedEntries(feedId: string, limit = 50) {
    const feed = await this.repository.findById(feedId);
    if (!feed) throw new NotFoundException('Feed not found');

    const entries = await this.repository.getFeedEntries(feedId, limit);
    return entries.map((e: any) => FeedEntryResponseDto.fromEntity(e));
  }

  async getFeedLogs(feedId: string, limit = 50) {
    const feed = await this.repository.findById(feedId);
    if (!feed) throw new NotFoundException('Feed not found');

    const logs = await this.repository.getSyncLogs(feedId, limit);
    return logs.map((l: any) => FeedLogResponseDto.fromEntity(l));
  }

  getSchedulerStatus() {
    return this.scheduler.getQueueStatus();
  }

  getAvailableFrequencies() {
    return this.scheduler.getAvailableFrequencies();
  }

  async getFeedHealth(feedId: string) {
    const feed = await this.repository.findById(feedId);
    if (!feed) throw new NotFoundException('Feed not found');

    return {
      feedId: feed.id,
      url: feed.url,
      status: feed.status,
      healthScore: feed.healthScore,
      healthLabel: this.healthService.getHealthLabel(feed.healthScore),
      successCount: feed.successCount,
      failureCount: feed.failureCount,
      lastSuccessAt: feed.lastSuccessAt,
      lastFailureAt: feed.lastFailureAt,
      averageResponseTime: feed.averageResponseTime,
      errorCount: feed.errorCount,
      lastError: feed.lastError,
      totalEntries: feed._count?.entries || 0,
    };
  }
}
