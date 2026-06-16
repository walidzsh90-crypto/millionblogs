import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { PaymentFilterDto } from './dto/payment-filter.dto';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    planId?: string;
    amount: number;
    currency?: string;
    status?: string;
    stripePaymentId?: string;
    stripeSessionId?: string;
    creditsPurchased?: number;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.payment.create({ data });
  }

  async findById(id: string) {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  async findByStripePaymentId(stripePaymentId: string) {
    return this.prisma.payment.findUnique({ where: { stripePaymentId } });
  }

  async findByStripeSessionId(stripeSessionId: string) {
    return this.prisma.payment.findFirst({
      where: { stripeSessionId },
    });
  }

  async findByIdempotencyKey(key: string) {
    return this.prisma.payment.findUnique({ where: { idempotencyKey: key } });
  }

  async findByUserId(userId: string, filter: PaymentFilterDto) {
    const where: Record<string, unknown> = { userId };
    if (filter.status) where.status = filter.status;

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.payment.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async findMany(filter: PaymentFilterDto) {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, email: true, displayName: true } } },
      }),
      this.prisma.payment.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  // Stripe webhook events
  async saveWebhookEvent(stripeEventId: string, type: string, payload: Record<string, unknown>) {
    return this.prisma.stripeWebhookEvent.create({
      data: { stripeEventId, type, payload },
    });
  }

  async findWebhookEvent(stripeEventId: string) {
    return this.prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId },
    });
  }

  async updateWebhookEvent(id: string, data: Record<string, unknown>) {
    return this.prisma.stripeWebhookEvent.update({ where: { id }, data });
  }

  async getStats() {
    const [total, completed, failed, refunded, totalRevenue] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'completed' } }),
      this.prisma.payment.count({ where: { status: 'failed' } }),
      this.prisma.payment.count({ where: { status: 'refunded' } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'completed' },
      }),
    ]);

    return {
      total,
      completed,
      failed,
      refunded,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }
}
