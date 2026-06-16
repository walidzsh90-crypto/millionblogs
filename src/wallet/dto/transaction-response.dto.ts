export class TransactionResponseDto {
  id: string;
  walletId: string;
  amount: number;
  type: string;
  source: string;
  reference: string | null;
  balanceBefore: number;
  balanceAfter: number;
  actorId: string | null;
  reason: string | null;
  createdAt: Date;

  static fromEntity(tx: any): TransactionResponseDto {
    return {
      id: tx.id,
      walletId: tx.walletId,
      amount: tx.amount,
      type: tx.type,
      source: tx.source,
      reference: tx.reference,
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
      actorId: tx.actorId,
      reason: tx.reason,
      createdAt: tx.createdAt,
    };
  }
}
