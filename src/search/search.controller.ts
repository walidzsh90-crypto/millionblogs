import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-result.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() query: SearchQueryDto): Promise<SearchResponseDto> {
    return this.searchService.search(query);
  }

  @Get('articles')
  async searchArticles(@Query() query: SearchQueryDto): Promise<SearchResponseDto> {
    return this.searchService.searchArticles(query);
  }

  @Get('blogs')
  async searchBlogs(@Query() query: SearchQueryDto): Promise<SearchResponseDto> {
    return this.searchService.searchBlogs(query);
  }
}
