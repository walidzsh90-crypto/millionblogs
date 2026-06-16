import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.wallet.findUnique({
      where: { userId },
    });
  }

  async findById(id: string) {
    return this.prisma.wallet.findUnique({
      where: { id },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
  }

  async create(userId: string) {
    return this.prisma.wallet.create({
      data: { userId, purchasedBalance: 0, bonusBalance: 0, totalBalance: 0 },
    });
  }

  async updateBalance(
    id: string,
    currentVersion: number,
    data: {
      purchasedBalance?: number;
      bonusBalance?: number;
      totalBalance: number;
    },
  ) {
    return this.prisma.wallet.update({
      where: { id, version: currentVersion },
      data: { ...data, version: { increment: 1 } },
    });
  }

  async createTransaction(data: {
    walletId: string;
    amount: number;
    type: string;
    source: string;
    reference?: string;
    balanceBefore: number;
    balanceAfter: number;
    actorId?: string;
    reason?: string;
    idempotencyKey?: string;
  }) {
    return this.prisma.walletTransaction.create({ data });
  }

  async findTransactionByIdempotencyKey(key: string) {
    return this.prisma.walletTransaction.findUnique({
      where: { idempotencyKey: key },
    });
  }

  async findTransactions(
    walletId: string,
    filter: { type?: string; source?: string; page: number; pageSize: number },
  ) {
    const where: Record<string, unknown> = { walletId };
    if (filter.type) where.type = filter.type;
    if (filter.source) where.source = filter.source;

    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.walletTransaction.count({ where: where as any }),
    ]);

    return { items, total, page: filter.page, pageSize: filter.pageSize };
  }

  async getTotalCreditsPurchased(userId: string): Promise<number> {
    const result = await this.prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { wallet: { userId }, type: 'credit', source: 'stripe_payment' },
    });
    return result._sum.amount || 0;
  }
}
