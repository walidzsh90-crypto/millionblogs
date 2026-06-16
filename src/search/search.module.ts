import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { SearchService } from './search.service';
import { SearchRepository } from './search.repository';
import { SearchController } from './search.controller';
import { SearchAnalyticsService } from './search-analytics.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository, SearchAnalyticsService],
  exports: [SearchService, SearchRepository],
})
export class SearchModule {}
