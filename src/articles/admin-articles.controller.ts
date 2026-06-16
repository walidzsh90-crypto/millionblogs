import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ArticlesService } from './articles.service';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleFilterDto } from './dto/article-filter.dto';
import { Roles, ROLES } from '../roles';

@Controller('admin/articles')
@UseGuards(AuthGuard('jwt'))
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async list(@Query() filter: ArticleFilterDto) {
    return this.articlesService.list(filter);
  }

  @Get('stats')
  async stats() {
    return this.articlesService.getStats();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.articlesService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, dto);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string) {
    return this.articlesService.update(id, { status: 'archived' } as UpdateArticleDto);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return this.articlesService.update(id, { status: 'published' } as UpdateArticleDto);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string) {
    return this.articlesService.update(id, { status: 'rejected' } as UpdateArticleDto);
  }
}
