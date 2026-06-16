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
import { FeedsService } from './feeds.service';
import { AddFeedDto } from './dto/add-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';
import { FeedFilterDto } from './dto/feed-filter.dto';
import { FeedResponseDto } from './dto/feed-response.dto';

@Controller('feeds')
@UseGuards(AuthGuard('jwt'))
export class FeedsController {
  constructor(private readonly feedsService: FeedsService) {}

  @Post()
  async add(
    @Body() dto: AddFeedDto,
    @Query('blogId') blogId: string,
  ): Promise<FeedResponseDto> {
    return this.feedsService.addFeed(blogId, dto);
  }

  @Get()
  async list(@Query() filter: FeedFilterDto) {
    return this.feedsService.list(filter);
  }

  @Get('stats')
  async stats() {
    return this.feedsService.getStats();
  }

  @Get('scheduler')
  async schedulerStatus() {
    return this.feedsService.getSchedulerStatus();
  }

  @Get('frequencies')
  async frequencies() {
    return this.feedsService.getAvailableFrequencies();
  }

  @Get('blog/:blogId')
  async findByBlog(@Param('blogId') blogId: string): Promise<FeedResponseDto[]> {
    return this.feedsService.findByBlog(blogId);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<FeedResponseDto> {
    return this.feedsService.findById(id);
  }

  @Get(':id/entries')
  async getEntries(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.feedsService.getFeedEntries(id, limit ? +limit : 50);
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.feedsService.getFeedLogs(id, limit ? +limit : 50);
  }

  @Get(':id/health')
  async getHealth(@Param('id') id: string) {
    return this.feedsService.getFeedHealth(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFeedDto,
  ): Promise<FeedResponseDto> {
    return this.feedsService.update(id, dto);
  }

  @Post(':id/sync')
  async sync(@Param('id') id: string) {
    return this.feedsService.syncFeed(id);
  }

  @Post(':id/pause')
  async pause(@Param('id') id: string): Promise<FeedResponseDto> {
    return this.feedsService.pause(id);
  }

  @Post(':id/enable')
  async enable(@Param('id') id: string): Promise<FeedResponseDto> {
    return this.feedsService.enable(id);
  }

  @Post(':id/disable')
  async disable(@Param('id') id: string): Promise<FeedResponseDto> {
    return this.feedsService.disable(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.feedsService.delete(id);
  }
}
