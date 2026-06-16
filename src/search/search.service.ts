import { Injectable } from '@nestjs/common';
import { SearchRepository } from './search.repository';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultDto, SearchResponseDto } from './dto/search-result.dto';
import { SearchAnalyticsService } from './search-analytics.service';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SearchService {
  constructor(
    private readonly repository: SearchRepository,
    private readonly analytics: SearchAnalyticsService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async search(query: SearchQueryDto): Promise<SearchResponseDto> {
    const startTime = Date.now();
    const searchTerm = query.q.trim();

    if (!searchTerm) {
      return {
        results: [],
        total: 0,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        totalPages: 0,
        query: '',
      };
    }

    const [articleResult, blogResult] = await Promise.all([
      this.repository.searchArticles(query),
      this.repository.searchBlogs(query),
    ]);

    const articleResults = articleResult.items.map((item: any) =>
      SearchResultDto.fromArticle(item, item.rank || 0),
    );
    const blogResults = blogResult.items.map((item: any) =>
      SearchResultDto.fromBlog(item, item.rank || 0),
    );

    const allResults = [...articleResults, ...blogResults].sort((a, b) => b.rank - a.rank);
    const total = articleResult.total + blogResult.total;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const totalPages = Math.ceil(total / pageSize);

    // Track analytics
    await this.analytics.track({
      query: searchTerm,
      resultsCount: total,
      language: query.language || 'all',
      timestamp: new Date(),
      durationMs: Date.now() - startTime,
    });

    // Emit event
    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.SEARCH_PERFORMED,
      aggregateId: 'search',
      aggregateType: 'search',
      payload: {
        query: searchTerm,
        resultsCount: total,
        language: query.language,
        durationMs: Date.now() - startTime,
      },
      occurredAt: new Date(),
    });

    return {
      results: allResults,
      total,
      page,
      pageSize,
      totalPages,
      query: searchTerm,
    };
  }

  async searchArticles(query: SearchQueryDto): Promise<SearchResponseDto> {
    const result = await this.repository.searchArticles(query);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    return {
      results: result.items.map((item: any) => SearchResultDto.fromArticle(item, item.rank || 0)),
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
      query: query.q,
    };
  }

  async searchBlogs(query: SearchQueryDto): Promise<SearchResponseDto> {
    const result = await this.repository.searchBlogs(query);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    return {
      results: result.items.map((item: any) => SearchResultDto.fromBlog(item, item.rank || 0)),
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
      query: query.q,
    };
  }
}
