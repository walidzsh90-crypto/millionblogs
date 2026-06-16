import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { ArticlesService } from './articles.service';
import { ArticlesRepository } from './articles.repository';
import { PublicArticlesController } from './public-articles.controller';
import { UserArticlesController } from './user-articles.controller';
import { AdminArticlesController } from './admin-articles.controller';
import { ContentPipelineService } from './pipeline/content-pipeline.service';
import { ArticleValidationService } from './pipeline/article-validation.service';
import { NormalizationService } from './pipeline/normalization.service';
import { ArticleDeduplicationService } from './pipeline/article-deduplication.service';
import { LanguageDetectionService } from './pipeline/language-detection.service';
import { CategorizationService } from './pipeline/categorization.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [
    PublicArticlesController,
    UserArticlesController,
    AdminArticlesController,
  ],
  providers: [
    ArticlesService,
    ArticlesRepository,
    ContentPipelineService,
    ArticleValidationService,
    NormalizationService,
    ArticleDeduplicationService,
    LanguageDetectionService,
    CategorizationService,
  ],
  exports: [ArticlesService, ArticlesRepository, ContentPipelineService],
})
export class ArticlesModule {}
