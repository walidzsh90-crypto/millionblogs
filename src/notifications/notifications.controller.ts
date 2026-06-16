import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { CurrentUser } from '../users';

@Controller('account/notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }, @Query() filter: NotificationFilterDto) {
    return this.notificationsService.getMyNotifications(user.id, filter);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Post(':id/read')
  async markRead(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('mark-all-read')
  async markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Post(':id/archive')
  async archive(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.notificationsService.archive(id, user.id);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.notificationsService.delete(id, user.id);
  }
}
