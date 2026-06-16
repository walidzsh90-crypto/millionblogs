import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { WalletModule } from '../wallet';
import { PlansModule } from '../plans';
import { SubscriptionsModule } from '../subscriptions';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';
import { PaymentsController, StripeWebhookController, AdminPaymentsController } from './payments.controller';
import { StripeService } from './stripe/stripe.service';
import { StripeWebhookService } from './stripe/stripe-webhook.service';
import { StripeConfig } from './stripe/stripe.config';

@Module({
  imports: [PrismaModule, EventsModule, WalletModule, PlansModule, SubscriptionsModule],
  controllers: [PaymentsController, StripeWebhookController, AdminPaymentsController],
  providers: [
    PaymentsService,
    PaymentsRepository,
    StripeService,
    StripeWebhookService,
    StripeConfig,
  ],
  exports: [PaymentsService, PaymentsRepository, StripeService],
})
export class PaymentsModule {}
