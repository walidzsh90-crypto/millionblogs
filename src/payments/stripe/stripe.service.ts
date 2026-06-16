import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeConfig } from './stripe.config';
import { PaymentsRepository } from '../payments.repository';
import { WalletService } from '../../wallet/wallet.service';
import { PlansRepository } from '../../plans/plans.repository';
import { SubscriptionsService } from '../../subscriptions';
import { DomainEventPublisher } from '../../events';
import { EventName } from '../../events/event-names';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: any;

  constructor(
    private readonly config: StripeConfig,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly walletService: WalletService,
    private readonly plansRepository: PlansRepository,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {
    if (typeof Stripe === 'function') {
      this.stripe = new Stripe(this.config.getSecretKey(), {
        apiVersion: '2023-10-16' as any,
      });
    }
  }

  async createCheckoutSession(params: {
    userId: string;
    planId: string;
    successUrl?: string;
    cancelUrl?: string;
    idempotencyKey?: string;
  }) {
    const plan = await this.plansRepository.findById(params.planId);
    if (!plan) throw new Error('Plan not found');
    if (plan.isFree) throw new Error('Cannot create checkout session for free plan');
    if (plan.status !== 'active') throw new Error('Plan is not active');

    const idempotencyKey = params.idempotencyKey || `checkout_${params.userId}_${params.planId}_${Date.now()}`;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: params.userId,
        planId: params.planId,
        idempotencyKey,
      },
      success_url: params.successUrl || this.config.getDefaultSuccessUrl(),
      cancel_url: params.cancelUrl || this.config.getDefaultCancelUrl(),
    }, {
      idempotencyKey,
    });

    const payment = await this.paymentsRepository.create({
      userId: params.userId,
      planId: params.planId,
      amount: plan.price,
      currency: plan.currency,
      status: 'pending',
      stripeSessionId: session.id,
      idempotencyKey,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PAYMENT_CREATED,
      aggregateId: payment.id,
      aggregateType: 'payment',
      payload: { paymentId: payment.id, userId: params.userId, amount: plan.price, planId: params.planId },
      occurredAt: new Date(),
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url,
      paymentId: payment.id,
    };
  }

  async createPaymentIntent(params: {
    userId: string;
    amount: number;
    idempotencyKey?: string;
  }) {
    const idempotencyKey = params.idempotencyKey || `pi_${params.userId}_${Date.now()}`;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: 'usd',
      metadata: {
        userId: params.userId,
        idempotencyKey,
      },
    }, {
      idempotencyKey,
    });

    const creditsPurchased = Math.floor(params.amount / this.config.getPricePerCredit());

    const payment = await this.paymentsRepository.create({
      userId: params.userId,
      amount: params.amount,
      status: 'pending',
      stripePaymentId: paymentIntent.id,
      creditsPurchased,
      idempotencyKey,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
      paymentIntentId: paymentIntent.id,
    };
  }

  async constructWebhookEvent(payload: Buffer | string, signature: string): Promise<any> {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.getWebhookSecret(),
    );
  }

  async processPaymentIntentSucceeded(paymentIntent: any) {
    const stripePaymentId = paymentIntent.id;
    const metadata = paymentIntent.metadata || {};

    let payment = await this.paymentsRepository.findByStripePaymentId(stripePaymentId);
    if (!payment) {
      payment = await this.paymentsRepository.create({
        userId: metadata.userId || 'unknown',
        amount: paymentIntent.amount,
        status: 'completed',
        stripePaymentId,
        creditsPurchased: Math.floor(paymentIntent.amount / this.config.getPricePerCredit()),
        metadata: metadata as any,
      });
    }

    await this.paymentsRepository.update(payment.id, {
      status: 'completed',
      completedAt: new Date(),
    });

    const credits = Math.floor(paymentIntent.amount / this.config.getPricePerCredit());
    if (credits > 0 && payment.userId !== 'unknown') {
      await this.walletService.credit(payment.userId, {
        amount: credits,
        source: 'stripe_payment',
        reference: stripePaymentId,
        idempotencyKey: `wallet_credit_${stripePaymentId}`,
      });
    }

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PAYMENT_COMPLETED,
      aggregateId: payment.id,
      aggregateType: 'payment',
      payload: { paymentId: payment.id, stripePaymentId, amount: paymentIntent.amount, userId: payment.userId },
      occurredAt: new Date(),
    });
  }

  async processPaymentIntentFailed(paymentIntent: any) {
    const stripePaymentId = paymentIntent.id;
    let payment = await this.paymentsRepository.findByStripePaymentId(stripePaymentId);

    if (payment) {
      await this.paymentsRepository.update(payment.id, {
        status: 'failed',
        failedAt: new Date(),
      });
    }

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PAYMENT_FAILED,
      aggregateId: payment?.id || 'unknown',
      aggregateType: 'payment',
      payload: { stripePaymentId, error: paymentIntent.last_payment_error?.message },
      occurredAt: new Date(),
    });
  }

  async processCheckoutSessionCompleted(session: any) {
    const stripeSessionId = session.id;
    const metadata = session.metadata || {};
    const paymentIntentId = session.payment_intent as string;

    let payment = await this.paymentsRepository.findByStripeSessionId(stripeSessionId);
    if (!payment) {
      payment = await this.paymentsRepository.findByStripePaymentId(paymentIntentId);
    }
    if (!payment) return;

    await this.paymentsRepository.update(payment.id, {
      status: 'completed',
      completedAt: new Date(),
      stripePaymentId: paymentIntentId,
    });

    if (metadata.planId) {
      const plan = await this.plansRepository.findById(metadata.planId);
      if (plan && !plan.isFree) {
        const credits = Math.floor(plan.price / this.config.getPricePerCredit());
        if (credits > 0) {
          await this.walletService.credit(metadata.userId || payment.userId, {
            amount: credits,
            source: 'stripe_payment',
            reference: paymentIntentId || stripeSessionId,
            idempotencyKey: `wallet_credit_session_${stripeSessionId}`,
          });
        }

        const userId = metadata.userId || payment.userId;
        try {
          const subscription = await this.subscriptionsService.createSubscription(userId, metadata.planId);
          await this.subscriptionsService.activateSubscription(subscription.id);
          this.logger.log(`Subscription activated for user ${userId} from checkout ${stripeSessionId}`);
        } catch (err) {
          this.logger.error(`Failed to activate subscription for user ${userId}: ${(err as Error).message}`);
        }
      }
    }

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PAYMENT_COMPLETED,
      aggregateId: payment.id,
      aggregateType: 'payment',
      payload: { paymentId: payment.id, stripeSessionId, amount: session.amount_total },
      occurredAt: new Date(),
    });
  }

  async processChargeRefunded(charge: any) {
    const paymentIntentId = charge.payment_intent as string;
    const payment = await this.paymentsRepository.findByStripePaymentId(paymentIntentId);
    if (!payment) return;

    await this.paymentsRepository.update(payment.id, {
      status: 'refunded',
      refundedAt: new Date(),
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PAYMENT_REFUNDED,
      aggregateId: payment.id,
      aggregateType: 'payment',
      payload: { paymentId: payment.id, stripePaymentId: paymentIntentId },
      occurredAt: new Date(),
    });
  }
}
