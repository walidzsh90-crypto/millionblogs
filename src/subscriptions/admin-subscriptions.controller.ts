import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles, ROLES } from '../roles';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionFilterDto } from './dto/subscription-filter.dto';
import { ExtendSubscriptionDto } from './dto/extend-subscription.dto';

@Controller('admin/subscriptions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async list(@Query() filter: SubscriptionFilterDto) {
    return this.subscriptionsService.getAllSubscriptions(filter);
  }

  @Get('stats')
  async stats() {
    return this.subscriptionsService.getStats();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.subscriptionsService.getSubscription(id);
  }

  @Post(':id/activate')
  async activate(@Param('id') id: string) {
    return this.subscriptionsService.activateSubscription(id);
  }

  @Post(':id/renew')
  async renew(@Param('id') id: string) {
    return this.subscriptionsService.renewSubscription(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(id);
  }

  @Post(':id/extend')
  async extend(@Param('id') id: string, @Body() dto: ExtendSubscriptionDto) {
    return this.subscriptionsService.extendSubscription(id, dto.extensionDays);
  }

  @Post(':id/suspend')
  async suspend(@Param('id') id: string) {
    return this.subscriptionsService.suspendSubscription(id);
  }

  @Post('process-renewals')
  async processRenewals() {
    return this.subscriptionsService.processRenewals();
  }
}
