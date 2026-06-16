import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles, ROLES } from '../roles';
import { PaymentsService } from './payments.service';
import { StripeWebhookService } from './stripe/stripe-webhook.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { CurrentUser } from '../users';
import { Request } from 'express';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  async createCheckoutSession(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.paymentsService.createCheckoutSession(user.id, dto);
  }

  @Get()
  async list(
    @CurrentUser() user: { id: string },
    @Query() filter: PaymentFilterDto,
  ) {
    return this.paymentsService.getUserPayments(user.id, filter);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }
}

@Controller('stripe/webhook')
export class StripeWebhookController {
  constructor(private readonly webhookService: StripeWebhookService) {}

  @Post()
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.webhookService.handleWebhook(req.body as Buffer, signature);
  }
}

@Controller('admin/payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async list(@Query() filter: PaymentFilterDto) {
    return this.paymentsService.getAllPayments(filter);
  }

  @Get('stats')
  async stats() {
    return this.paymentsService.getStats();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }
}
