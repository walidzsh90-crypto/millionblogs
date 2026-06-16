import { Controller, Get, Param, Query } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticleFilterDto } from './dto/article-filter.dto';
import { ArticleResponseDto } from './dto/article-response.dto';

@Controller('articles')
export class PublicArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async list(@Query() filter: ArticleFilterDto) {
    filter.public = true;
    return this.articlesService.list(filter);
  }

  @Get(':blogSlug/:articleSlug')
  async findBySlug(
    @Param('blogSlug') blogSlug: string,
    @Param('articleSlug') articleSlug: string,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.findBySlug(blogSlug, articleSlug);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ArticleResponseDto> {
    return this.articlesService.findById(id);
  }
}
