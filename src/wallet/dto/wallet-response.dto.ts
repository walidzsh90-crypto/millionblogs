export class WalletResponseDto {
  id: string;
  userId: string;
  purchasedBalance: number;
  bonusBalance: number;
  totalBalance: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(wallet: any): WalletResponseDto {
    return {
      id: wallet.id,
      userId: wallet.userId,
      purchasedBalance: wallet.purchasedBalance,
      bonusBalance: wallet.bonusBalance,
      totalBalance: wallet.totalBalance,
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}
