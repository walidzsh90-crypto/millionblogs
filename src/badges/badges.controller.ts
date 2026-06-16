import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles, ROLES } from '../roles';
import { BadgesService } from './badges.service';
import { AdminAssignBadgeDto } from './dto/admin-assign-badge.dto';
import { CurrentUser } from '../users';

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  async getAll() {
    return this.badgesService.getAllBadges();
  }

  @Get('user/:userId')
  async getUserBadges(@Param('userId') userId: string) {
    return this.badgesService.getUserBadges(userId);
  }
}

@Controller('account/badges')
@UseGuards(AuthGuard('jwt'))
export class AccountBadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  async getMyBadges(@CurrentUser() user: { id: string }) {
    return this.badgesService.getMyBadges(user.id);
  }

  @Post(':id/visibility')
  async toggleVisibility(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body('visible') visible: boolean) {
    return this.badgesService.setBadgeVisibility(user.id, id, visible);
  }
}

@Controller('admin/badges')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminBadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Post()
  async create(@Body() dto: any) {
    return this.badgesService.createBadge(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.badgesService.updateBadge(id, dto);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string) {
    return this.badgesService.archiveBadge(id);
  }

  @Post('assign')
  async assign(@Body() dto: AdminAssignBadgeDto) {
    return this.badgesService.assignBadgeToUser(dto.userId, dto.badgeId);
  }

  @Post(':badgeId/revoke/:userId')
  async revoke(@Param('badgeId') badgeId: string, @Param('userId') userId: string) {
    return this.badgesService.revokeBadgeFromUser(userId, badgeId);
  }

  @Get('stats')
  async stats() {
    return this.badgesService.getStats();
  }
}
