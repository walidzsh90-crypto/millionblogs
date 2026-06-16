import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CurrentUser } from '../users';

@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(user.id, dto.planId);
  }

  @Get()
  async list(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getMySubscriptions(user.id);
  }

  @Get('active')
  async getActive(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getMyActiveSubscription(user.id);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.subscriptionsService.getSubscription(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(id);
  }
}
