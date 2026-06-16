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
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogFilterDto } from './dto/blog-filter.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { CurrentUser } from '../users';
import { OptionalAuthGuard } from '../auth';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateBlogDto,
  ): Promise<BlogResponseDto> {
    return this.blogsService.create(user.id, dto);
  }

  @Get()
  @UseGuards(OptionalAuthGuard)
  async list(@Query() filter: BlogFilterDto) {
    return this.blogsService.list(filter);
  }

  @Get('stats')
  async stats() {
    return this.blogsService.getStats();
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async myBlogs(@CurrentUser() user: { id: string }): Promise<BlogResponseDto[]> {
    return this.blogsService.findByUser(user.id);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string): Promise<BlogResponseDto> {
    return this.blogsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateBlogDto,
  ): Promise<BlogResponseDto> {
    return this.blogsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<void> {
    return this.blogsService.softDelete(user.id, id);
  }
}
