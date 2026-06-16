import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleFilterDto } from './dto/article-filter.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { CurrentUser } from '../users';

@Controller('user/articles')
@UseGuards(AuthGuard('jwt'))
export class UserArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  async create(
    @CurrentUser() _user: { id: string },
    @Body() dto: CreateArticleDto,
    @Query('blogId') blogId: string,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.create(blogId, dto);
  }

  @Get()
  async list(
    @CurrentUser() _user: { id: string },
    @Query() filter: ArticleFilterDto,
  ) {
    return this.articlesService.list(filter);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ArticleResponseDto> {
    return this.articlesService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.articlesService.delete(id);
  }

  @Post(':id/click')
  async recordClick(@Param('id') id: string): Promise<void> {
    return this.articlesService.recordClick(id);
  }
}
