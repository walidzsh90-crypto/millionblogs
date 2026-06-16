import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SubscriptionsRepository } from './subscriptions.repository';
import { PlansRepository } from '../plans/plans.repository';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionFilterDto } from './dto/subscription-filter.dto';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly gracePeriodDays = 7;

  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly plansRepository: PlansRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly moduleRef: ModuleRef,
  ) {}

  async createSubscription(userId: string, planId: string) {
    const plan = await this.plansRepository.findById(planId);
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.isFree) throw new BadRequestException('Cannot create subscription for free plan');
    if (plan.status !== 'active') throw new BadRequestException('Plan is not active');

    const existing = await this.subscriptionsRepository.findActiveByUserId(userId);
    if (existing) throw new ConflictException('User already has an active subscription');

    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, plan.slug);

    const subscription = await this.subscriptionsRepository.create({
      userId,
      planId,
      status: 'pending',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      expirationDate: periodEnd,
      gracePeriodEnd: new Date(periodEnd.getTime() + this.gracePeriodDays * 24 * 60 * 60 * 1000),
      nextBillingDate: periodEnd,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.SUBSCRIPTION_CREATED,
      aggregateId: subscription.id,
      aggregateType: 'subscription',
      payload: { subscriptionId: subscription.id, userId, planId: planId, planName: plan.name },
      occurredAt: new Date(),
    });

    return SubscriptionResponseDto.fromEntity(subscription);
  }

  async activateSubscription(subscriptionId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== 'pending' && sub.status !== 'cancelled') {
      throw new BadRequestException(`Cannot activate subscription in status: ${sub.status}`);
    }

    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, sub.plan.slug);

    const updated = await this.subscriptionsRepository.update(subscriptionId, {
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      nextBillingDate: periodEnd,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.SUBSCRIPTION_ACTIVATED,
      aggregateId: subscriptionId,
      aggregateType: 'subscription',
      payload: { subscriptionId, userId: sub.userId, planId: sub.planId, planName: sub.plan.name },
      occurredAt: new Date(),
    });

    return SubscriptionResponseDto.fromEntity(updated);
  }

  async renewSubscription(subscriptionId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== 'active' && sub.status !== 'grace_period') {
      throw new BadRequestException(`Cannot renew subscription in status: ${sub.status}`);
    }

    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, sub.plan.slug);

    const updated = await this.subscriptionsRepository.update(subscriptionId, {
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      expirationDate: periodEnd,
      gracePeriodEnd: new Date(periodEnd.getTime() + this.gracePeriodDays * 24 * 60 * 60 * 1000),
      nextBillingDate: periodEnd,
    });

    await this.subscriptionsRepository.createInvoice({
      subscriptionId,
      amount: sub.plan.price,
      currency: sub.plan.currency,
      status: 'paid',
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.SUBSCRIPTION_RENEWED,
      aggregateId: subscriptionId,
      aggregateType: 'subscription',
      payload: { subscriptionId, userId: sub.userId, planId: sub.planId, planName: sub.plan.name },
      occurredAt: new Date(),
    });

    return SubscriptionResponseDto.fromEntity(updated);
  }

  async cancelSubscription(subscriptionId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status === 'cancelled' || sub.status === 'expired') {
      throw new BadRequestException(`Subscription already ${sub.status}`);
    }

    const now = new Date();
    const updated = await this.subscriptionsRepository.update(subscriptionId, {
      status: 'cancelled',
      cancelledAt: now,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.SUBSCRIPTION_CANCELLED,
      aggregateId: subscriptionId,
      aggregateType: 'subscription',
      payload: { subscriptionId, userId: sub.userId, planId: sub.planId },
      occurredAt: new Date(),
    });

    return SubscriptionResponseDto.fromEntity(updated);
  }

  async expireSubscription(subscriptionId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');

    const now = new Date();
    const updated = await this.subscriptionsRepository.update(subscriptionId, {
      status: 'expired',
      expirationDate: now,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.SUBSCRIPTION_EXPIRED,
      aggregateId: subscriptionId,
      aggregateType: 'subscription',
      payload: { subscriptionId, userId: sub.userId, planId: sub.planId },
      occurredAt: new Date(),
    });

    return SubscriptionResponseDto.fromEntity(updated);
  }

  async enterGracePeriod(subscriptionId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');

    const now = new Date();
    const graceEnd = new Date(now.getTime() + this.gracePeriodDays * 24 * 60 * 60 * 1000);

    const updated = await this.subscriptionsRepository.update(subscriptionId, {
      status: 'grace_period',
      gracePeriodEnd: graceEnd,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.SUBSCRIPTION_GRACE_PERIOD,
      aggregateId: subscriptionId,
      aggregateType: 'subscription',
      payload: { subscriptionId, userId: sub.userId, gracePeriodEnd: graceEnd },
      occurredAt: new Date(),
    });

    return SubscriptionResponseDto.fromEntity(updated);
  }

  async suspendSubscription(subscriptionId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');

    const updated = await this.subscriptionsRepository.update(subscriptionId, {
      status: 'suspended',
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.SUBSCRIPTION_SUSPENDED,
      aggregateId: subscriptionId,
      aggregateType: 'subscription',
      payload: { subscriptionId, userId: sub.userId, planId: sub.planId },
      occurredAt: new Date(),
    });

    return SubscriptionResponseDto.fromEntity(updated);
  }

  async extendSubscription(subscriptionId: string, extensionDays: number) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');

    const currentEnd = sub.currentPeriodEnd || new Date();
    const newEnd = new Date(currentEnd.getTime() + extensionDays * 24 * 60 * 60 * 1000);

    const data: Record<string, unknown> = {
      currentPeriodEnd: newEnd,
      renewalDate: newEnd,
      expirationDate: newEnd,
    };

    if (sub.status === 'expired' || sub.status === 'cancelled') {
      data.status = 'active';
      data.currentPeriodStart = new Date();
    }

    const updated = await this.subscriptionsRepository.update(subscriptionId, data);

    return SubscriptionResponseDto.fromEntity(updated);
  }

  async getMySubscriptions(userId: string) {
    const subs = await this.subscriptionsRepository.findByUserId(userId);
    return subs.map((s: any) => SubscriptionResponseDto.fromEntity(s));
  }

  async getMyActiveSubscription(userId: string) {
    const sub = await this.subscriptionsRepository.findActiveByUserId(userId);
    if (!sub) return null;
    return SubscriptionResponseDto.fromEntity(sub);
  }

  async getSubscription(id: string) {
    const sub = await this.subscriptionsRepository.findById(id);
    if (!sub) throw new NotFoundException('Subscription not found');
    return SubscriptionResponseDto.fromEntity(sub);
  }

  async getAllSubscriptions(filter: SubscriptionFilterDto) {
    const result = await this.subscriptionsRepository.findAll(filter);
    return {
      ...result,
      items: result.items.map((s: any) => SubscriptionResponseDto.fromEntity(s)),
    };
  }

  async getStats() {
    return this.subscriptionsRepository.getStats();
  }

  async processRenewals() {
    const now = new Date();
    const expiring = await this.subscriptionsRepository.findExpiring(now);
    let renewed = 0;
    let movedToGrace = 0;

    for (const sub of expiring) {
      try {
        const paymentSuccess = await this.attemptRenewalPayment(sub);
        if (paymentSuccess) {
          await this.renewSubscription(sub.id);
          renewed++;
          this.logger.log(`Subscription ${sub.id} renewed with payment`);
        } else {
          await this.enterGracePeriod(sub.id);
          movedToGrace++;
          this.logger.log(`Subscription ${sub.id} entered grace period (payment failed)`);
        }
      } catch (err) {
        this.logger.error(`Failed to process renewal for ${sub.id}: ${(err as Error).message}`);
      }
    }

    const graceExpired = await this.subscriptionsRepository.findGracePeriodExpired(now);
    for (const sub of graceExpired) {
      try {
        await this.expireSubscription(sub.id);
        this.logger.log(`Subscription ${sub.id} expired after grace period`);
      } catch (err) {
        this.logger.error(`Failed to expire ${sub.id}: ${(err as Error).message}`);
      }
    }

    return { renewed, movedToGrace, expired: graceExpired.length };
  }

  private async attemptRenewalPayment(sub: any): Promise<boolean> {
    try {
      const StripeService = (await import('../payments/stripe/stripe.service')).StripeService;
      const stripeService = this.moduleRef.get(StripeService, { strict: false });
      if (!stripeService) return false;

      const paymentIntent = await stripeService.createPaymentIntent({
        userId: sub.userId,
        amount: sub.plan.price,
        idempotencyKey: `renewal_${sub.id}_${Date.now()}`,
      });

      return !!paymentIntent;
    } catch {
      return false;
    }
  }

  private calculatePeriodEnd(from: Date, planSlug: string): Date {
    const isMonthly = planSlug.includes('monthly');
    const days = isMonthly ? 30 : 365;
    return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
