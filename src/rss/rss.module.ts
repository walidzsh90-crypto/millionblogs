import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { FeedsService } from './feeds.service';
import { FeedsRepository } from './feeds.repository';
import { FeedsController } from './feeds.controller';
import { AdminFeedsController } from './admin-feeds.controller';
import { FeedValidatorService } from './validation/feed-validator.service';
import { RssValidator } from './validation/rss-validator.service';
import { AtomValidator } from './validation/atom-validator.service';
import { FeedParserFactory } from './parsing/feed-parser.factory';
import { RssParserService } from './parsing/rss-parser.service';
import { AtomParserService } from './parsing/atom-parser.service';
import { FeedSchedulerService } from './scheduler/feed-scheduler.service';
import { PriorityQueueService } from './scheduler/priority-queue.service';
import { RetryQueueService } from './scheduler/retry-queue.service';
import { DeadLetterQueueService } from './scheduler/dead-letter-queue.service';
import { FeedHealthService } from './health/feed-health.service';
import { DuplicateDetectionService } from './detection/duplicate-detection.service';
import { FeedLogService } from './logs/feed-log.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [FeedsController, AdminFeedsController],
  providers: [
    FeedsService,
    FeedsRepository,
    FeedValidatorService,
    RssValidator,
    AtomValidator,
    FeedParserFactory,
    RssParserService,
    AtomParserService,
    FeedSchedulerService,
    PriorityQueueService,
    RetryQueueService,
    DeadLetterQueueService,
    FeedHealthService,
    DuplicateDetectionService,
    FeedLogService,
  ],
  exports: [FeedsService, FeedsRepository, FeedSchedulerService],
})
export class RssModule {}
