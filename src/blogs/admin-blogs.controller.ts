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
import { BlogsService } from './blogs.service';
import { AdminBlogService } from './admin-blog.service';
import { AdminUpdateBlogDto } from './dto/admin-update-blog.dto';
import { TransferOwnershipDto } from './dto/transfer-ownership.dto';
import { BlogFilterDto } from './dto/blog-filter.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { Roles, ROLES } from '../roles';

@Controller('admin/blogs')
@UseGuards(AuthGuard('jwt'))
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminBlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly adminBlogService: AdminBlogService,
  ) {}

  @Get()
  async list(@Query() filter: BlogFilterDto) {
    return this.blogsService.list(filter);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<BlogResponseDto> {
    return this.blogsService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateBlogDto,
  ): Promise<BlogResponseDto> {
    return this.adminBlogService.adminUpdate(id, dto);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string): Promise<BlogResponseDto> {
    return this.adminBlogService.adminRestore(id);
  }

  @Post(':id/transfer')
  async transferOwnership(
    @Param('id') id: string,
    @Body() dto: TransferOwnershipDto,
  ): Promise<BlogResponseDto> {
    return this.adminBlogService.transferOwnership(id, dto.newOwnerId);
  }
}
