import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PaymentsRepository } from '../payments.repository';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentsRepository: PaymentsRepository,
  ) {}

  async handleWebhook(payload: Buffer, signature: string): Promise<{ received: boolean }> {
    try {
      const event = await this.stripeService.constructWebhookEvent(payload, signature);

      const existing = await this.paymentsRepository.findWebhookEvent(event.id);
      if (existing) {
        this.logger.log(`Duplicate webhook event: ${event.id}`);
        return { received: true };
      }

      await this.paymentsRepository.saveWebhookEvent(
        event.id,
        event.type,
        event.data.object as Record<string, unknown>,
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.stripeService.processPaymentIntentSucceeded(
            event.data.object as any,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.stripeService.processPaymentIntentFailed(
            event.data.object as any,
          );
          break;

        case 'checkout.session.completed':
          await this.stripeService.processCheckoutSessionCompleted(
            event.data.object as any,
          );
          break;

        case 'charge.refunded':
          await this.stripeService.processChargeRefunded(
            event.data.object as any,
          );
          break;

        default:
          this.logger.log(`Unhandled webhook type: ${event.type}`);
      }

      await this.paymentsRepository.updateWebhookEvent(
        (await this.paymentsRepository.findWebhookEvent(event.id))!.id,
        { status: 'processed', processedAt: new Date() },
      );

      return { received: true };
    } catch (err) {
      this.logger.error(`Webhook processing failed: ${(err as Error).message}`);
      throw err;
    }
  }
}
