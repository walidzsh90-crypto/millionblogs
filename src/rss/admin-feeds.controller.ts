import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedsService } from './feeds.service';
import { FeedFilterDto } from './dto/feed-filter.dto';
import { Roles, ROLES } from '../roles';

@Controller('admin/feeds')
@UseGuards(AuthGuard('jwt'))
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminFeedsController {
  constructor(private readonly feedsService: FeedsService) {}

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

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.feedsService.findById(id);
  }

  @Get(':id/health')
  async getHealth(@Param('id') id: string) {
    return this.feedsService.getFeedHealth(id);
  }

  @Post(':id/sync')
  async sync(@Param('id') id: string) {
    return this.feedsService.syncFeed(id);
  }

  @Post(':id/disable')
  async disable(@Param('id') id: string) {
    return this.feedsService.disable(id);
  }

  @Post(':id/enable')
  async enable(@Param('id') id: string) {
    return this.feedsService.enable(id);
  }

  @Post(':id/pause')
  async pause(@Param('id') id: string) {
    return this.feedsService.pause(id);
  }
}
