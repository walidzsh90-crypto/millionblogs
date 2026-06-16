import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { WalletRepository } from './wallet.repository';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { PrismaService } from '../prisma';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(
    private readonly repository: WalletRepository,
    private readonly prisma: PrismaService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async getOrCreateWallet(userId: string): Promise<WalletResponseDto> {
    let wallet = await this.repository.findByUserId(userId);
    if (!wallet) {
      wallet = await this.repository.create(userId);
    }
    return WalletResponseDto.fromEntity(wallet);
  }

  async getWallet(userId: string): Promise<WalletResponseDto> {
    const wallet = await this.repository.findByUserId(userId);
    if (!wallet) throw new NotFoundException('Wallet not found');
    return WalletResponseDto.fromEntity(wallet);
  }

  private async getWalletWithLock(userId: string) {
    const wallet = await this.repository.findByUserId(userId);
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  private async updateWalletWithVersion(tx: any, id: string, version: number, data: any) {
    try {
      return await tx.wallet.update({
        where: { id, version },
        data,
      });
    } catch (err) {
      if ((err as any) instanceof PrismaClientKnownRequestError && (err as any).code === 'P2025') {
        throw new ConflictException('Wallet version conflict, retry');
      }
      throw err;
    }
  }

  async credit(
    userId: string,
    dto: CreditWalletDto,
  ): Promise<{ wallet: WalletResponseDto; transaction: TransactionResponseDto }> {
    return this.prisma.$transaction(async (tx: any) => {
      // Idempotency check inside transaction
      if (dto.idempotencyKey) {
        const existing = await tx.walletTransaction.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
        });
        if (existing) {
          const wallet = await tx.wallet.findUnique({ where: { userId } });
          return {
            wallet: WalletResponseDto.fromEntity(wallet),
            transaction: TransactionResponseDto.fromEntity(existing),
          };
        }
      }

      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const bonusAmount =
        dto.source === 'bonus' || dto.source === 'admin_adjustment'
          ? dto.amount
          : 0;
      const purchasedAmount =
        dto.source !== 'bonus' && dto.source !== 'admin_adjustment'
          ? dto.amount
          : 0;

      const newPurchased = wallet.purchasedBalance + purchasedAmount;
      const newBonus = wallet.bonusBalance + bonusAmount;
      const newTotal = newPurchased + newBonus;

      const updated = await this.updateWalletWithVersion(tx, wallet.id, wallet.version, {
        purchasedBalance: newPurchased,
        bonusBalance: newBonus,
        totalBalance: newTotal,
        version: { increment: 1 },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: dto.amount,
          type: 'credit',
          source: dto.source,
          reference: dto.reference,
          balanceBefore: wallet.totalBalance,
          balanceAfter: newTotal,
          actorId: dto.actorId,
          reason: dto.reason,
          idempotencyKey: dto.idempotencyKey,
        },
      });

      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.WALLET_CREDITED,
        aggregateId: wallet.id,
        aggregateType: 'wallet',
        payload: {
          userId,
          amount: dto.amount,
          source: dto.source,
          newBalance: newTotal,
          reference: dto.reference,
        },
        occurredAt: new Date(),
      });

      return {
        wallet: WalletResponseDto.fromEntity(updated),
        transaction: TransactionResponseDto.fromEntity(transaction),
      };
    });
  }

  async debit(
    userId: string,
    amount: number,
    reason: string,
    reference?: string,
    idempotencyKey?: string,
  ): Promise<{ wallet: WalletResponseDto; transaction: TransactionResponseDto }> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (!reason) throw new BadRequestException('Reason is required for debit');

    return this.prisma.$transaction(async (tx: any) => {
      // Idempotency check inside transaction
      if (idempotencyKey) {
        const existing = await tx.walletTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existing) {
          const wallet = await tx.wallet.findUnique({ where: { userId } });
          return {
            wallet: WalletResponseDto.fromEntity(wallet),
            transaction: TransactionResponseDto.fromEntity(existing),
          };
        }
      }

      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      if (wallet.totalBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Debit from purchased first, then bonus
      let purchasedDebit = Math.min(amount, wallet.purchasedBalance);
      let bonusDebit = amount - purchasedDebit;

      const newPurchased = wallet.purchasedBalance - purchasedDebit;
      const newBonus = wallet.bonusBalance - bonusDebit;
      const newTotal = newPurchased + newBonus;

      const updated = await this.updateWalletWithVersion(tx, wallet.id, wallet.version, {
        purchasedBalance: newPurchased,
        bonusBalance: newBonus,
        totalBalance: newTotal,
        version: { increment: 1 },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          type: 'debit',
          source: 'spend',
          reference,
          balanceBefore: wallet.totalBalance,
          balanceAfter: newTotal,
          reason,
          idempotencyKey,
        },
      });

      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.WALLET_DEBITED,
        aggregateId: wallet.id,
        aggregateType: 'wallet',
        payload: {
          userId,
          amount,
          reason,
          newBalance: newTotal,
        },
        occurredAt: new Date(),
      });

      return {
        wallet: WalletResponseDto.fromEntity(updated),
        transaction: TransactionResponseDto.fromEntity(transaction),
      };
    });
  }

  async hold(
    userId: string,
    amount: number,
    reason: string,
    reference?: string,
  ): Promise<{ wallet: WalletResponseDto; transaction: TransactionResponseDto }> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    return this.prisma.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');
      if (wallet.totalBalance < amount) {
        throw new BadRequestException('Insufficient balance to hold');
      }

      // Deduct from purchased first, then bonus
      let purchasedDebit = Math.min(amount, wallet.purchasedBalance);
      let bonusDebit = amount - purchasedDebit;

      const newPurchased = wallet.purchasedBalance - purchasedDebit;
      const newBonus = wallet.bonusBalance - bonusDebit;
      const newTotal = newPurchased + newBonus;

      const updated = await this.updateWalletWithVersion(tx, wallet.id, wallet.version, {
        purchasedBalance: newPurchased,
        bonusBalance: newBonus,
        totalBalance: newTotal,
        version: { increment: 1 },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          type: 'hold',
          source: 'hold',
          reference,
          balanceBefore: wallet.totalBalance,
          balanceAfter: newTotal,
          reason,
        },
      });

      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.WALLET_DEBITED,
        aggregateId: wallet.id,
        aggregateType: 'wallet',
        payload: { userId, amount, reason: `Hold: ${reason}`, newBalance: newTotal },
        occurredAt: new Date(),
      });

      return {
        wallet: WalletResponseDto.fromEntity(updated),
        transaction: TransactionResponseDto.fromEntity(transaction),
      };
    });
  }

  async release(
    userId: string,
    holdTransactionId: string,
  ): Promise<{ wallet: WalletResponseDto; transaction: TransactionResponseDto }> {
    const holdTx = await this.prisma.walletTransaction.findUnique({
      where: { id: holdTransactionId },
      include: { wallet: true },
    });
    if (!holdTx || holdTx.type !== 'hold') {
      throw new BadRequestException('Invalid hold transaction');
    }
    if (holdTx.wallet.userId !== userId) {
      throw new BadRequestException('Hold does not belong to this user');
    }

    const releasedAmount = Math.abs(holdTx.amount);

    return this.prisma.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: holdTx.wallet.id, version: holdTx.wallet.version },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      // Restore to purchased balance
      const newPurchased = wallet.purchasedBalance + releasedAmount;
      const newTotal = newPurchased + wallet.bonusBalance;

      const updated = await this.updateWalletWithVersion(tx, wallet.id, wallet.version, {
        purchasedBalance: newPurchased,
        totalBalance: newTotal,
        version: { increment: 1 },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: releasedAmount,
          type: 'release',
          source: 'hold_release',
          reference: holdTransactionId,
          balanceBefore: wallet.totalBalance,
          balanceAfter: newTotal,
          reason: 'Hold released',
        },
      });

      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.WALLET_CREDITED,
        aggregateId: wallet.id,
        aggregateType: 'wallet',
        payload: { userId, amount: releasedAmount, reason: 'Hold released', newBalance: newTotal },
        occurredAt: new Date(),
      });

      return {
        wallet: WalletResponseDto.fromEntity(updated),
        transaction: TransactionResponseDto.fromEntity(transaction),
      };
    });
  }

  async refund(
    userId: string,
    originalTransactionId: string,
    reason: string,
  ): Promise<{ wallet: WalletResponseDto; transaction: TransactionResponseDto }> {
    const originalTx = await this.prisma.walletTransaction.findUnique({
      where: { id: originalTransactionId },
      include: { wallet: true },
    });
    if (!originalTx) throw new NotFoundException('Original transaction not found');
    if (originalTx.wallet.userId !== userId) {
      throw new BadRequestException('Transaction does not belong to this user');
    }
    if (originalTx.type === 'refund') {
      throw new BadRequestException('Cannot refund a refund');
    }

    const refundAmount = Math.abs(originalTx.amount);
    const wallet = originalTx.wallet;

    return this.prisma.$transaction(async (tx: any) => {
      const current = await tx.wallet.findUnique({
        where: { id: wallet.id, version: wallet.version },
      });
      if (!current) throw new NotFoundException('Wallet not found');

      const newPurchased = current.purchasedBalance + refundAmount;
      const newTotal = newPurchased + current.bonusBalance;

      const updated = await this.updateWalletWithVersion(tx, wallet.id, wallet.version, {
        purchasedBalance: newPurchased,
        totalBalance: newTotal,
        version: { increment: 1 },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: refundAmount,
          type: 'refund',
          source: 'refund',
          reference: originalTransactionId,
          balanceBefore: current.totalBalance,
          balanceAfter: newTotal,
          actorId: userId,
          reason,
        },
      });

      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.WALLET_REFUNDED,
        aggregateId: wallet.id,
        aggregateType: 'wallet',
        payload: { userId, amount: refundAmount, reason },
        occurredAt: new Date(),
      });

      return {
        wallet: WalletResponseDto.fromEntity(updated),
        transaction: TransactionResponseDto.fromEntity(transaction),
      };
    });
  }

  async adminAdjustment(
    adminId: string,
    userId: string,
    amount: number,
    reason: string,
  ): Promise<{ wallet: WalletResponseDto; transaction: TransactionResponseDto }> {
    if (amount === 0) throw new BadRequestException('Amount must be non-zero');

    return this.prisma.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('User has no wallet');

      const newPurchased =
        amount > 0 ? wallet.purchasedBalance + amount : wallet.purchasedBalance;
      const newBonus =
        amount < 0
          ? wallet.bonusBalance + amount
          : wallet.bonusBalance;
      const newTotal = newPurchased + newBonus;

      if (newTotal < 0) {
        throw new BadRequestException('Adjustment would make balance negative');
      }

      const updated = await this.updateWalletWithVersion(tx, wallet.id, wallet.version, {
        purchasedBalance: newPurchased,
        bonusBalance: newBonus,
        totalBalance: newTotal,
        version: { increment: 1 },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'adjustment',
          source: 'admin_adjustment',
          balanceBefore: wallet.totalBalance,
          balanceAfter: newTotal,
          actorId: adminId,
          reason,
        },
      });

      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.WALLET_ADJUSTED,
        aggregateId: wallet.id,
        aggregateType: 'wallet',
        payload: { userId, amount, reason, actorId: adminId },
        occurredAt: new Date(),
      });

      return {
        wallet: WalletResponseDto.fromEntity(updated),
        transaction: TransactionResponseDto.fromEntity(transaction),
      };
    });
  }

  async getTransactions(
    userId: string,
    filter: { type?: string; source?: string; page: number; pageSize: number },
  ) {
    const wallet = await this.getWalletWithLock(userId);
    return this.repository.findTransactions(wallet.id, filter);
  }

  async getBalance(userId: string): Promise<{
    totalBalance: number;
    purchasedBalance: number;
    bonusBalance: number;
  }> {
    const wallet = await this.repository.findByUserId(userId);
    if (!wallet) return { totalBalance: 0, purchasedBalance: 0, bonusBalance: 0 };
    return {
      totalBalance: wallet.totalBalance,
      purchasedBalance: wallet.purchasedBalance,
      bonusBalance: wallet.bonusBalance,
    };
  }
}
