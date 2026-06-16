import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { SubscriptionFilterDto } from './dto/subscription-filter.dto';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    planId: string;
    status?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    renewalDate?: Date;
    expirationDate?: Date;
    gracePeriodEnd?: Date;
    nextBillingDate?: Date;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.userSubscription.create({ data });
  }

  async findById(id: string) {
    return this.prisma.userSubscription.findUnique({
      where: { id },
      include: { plan: true },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.userSubscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByUserId(userId: string) {
    return this.prisma.userSubscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: true },
    });
  }

  async findActiveByPlanId(planId: string) {
    return this.prisma.userSubscription.findMany({
      where: { planId, status: 'active' },
      include: { plan: true },
    });
  }

  async findByUserIdAndPlan(userId: string, planId: string) {
    return this.prisma.userSubscription.findFirst({
      where: { userId, planId },
      include: { plan: true },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.userSubscription.update({ where: { id }, data });
  }

  async findExpiring(now: Date) {
    return this.prisma.userSubscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: { lte: now },
      },
      include: { plan: true },
    });
  }

  async findGracePeriodExpired(now: Date) {
    return this.prisma.userSubscription.findMany({
      where: {
        status: 'grace_period',
        gracePeriodEnd: { lte: now },
      },
      include: { plan: true },
    });
  }

  async findExpiringSoon(withinDays: number) {
    const future = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    return this.prisma.userSubscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: { lte: future, gte: new Date() },
      },
      include: { plan: true },
    });
  }

  async findAll(filter: SubscriptionFilterDto) {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.planId) where.planId = filter.planId;

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.userSubscription.findMany({
        where: where as any,
        include: { plan: true, user: { select: { id: true, email: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.userSubscription.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async getStats() {
    const [total, active, gracePeriod, expired, cancelled, suspended] = await Promise.all([
      this.prisma.userSubscription.count(),
      this.prisma.userSubscription.count({ where: { status: 'active' } }),
      this.prisma.userSubscription.count({ where: { status: 'grace_period' } }),
      this.prisma.userSubscription.count({ where: { status: 'expired' } }),
      this.prisma.userSubscription.count({ where: { status: 'cancelled' } }),
      this.prisma.userSubscription.count({ where: { status: 'suspended' } }),
    ]);

    return { total, active, gracePeriod, expired, cancelled, suspended };
  }

  async createInvoice(data: {
    subscriptionId: string;
    amount: number;
    currency?: string;
    status?: string;
  }) {
    return this.prisma.subscriptionInvoice.create({ data });
  }
}
