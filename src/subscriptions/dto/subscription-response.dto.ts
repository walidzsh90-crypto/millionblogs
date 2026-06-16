export class SubscriptionResponseDto {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planSlug: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  renewalDate: Date | null;
  expirationDate: Date | null;
  gracePeriodEnd: Date | null;
  cancelledAt: Date | null;
  nextBillingDate: Date | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(sub: any): SubscriptionResponseDto {
    return {
      id: sub.id,
      userId: sub.userId,
      planId: sub.planId,
      planName: sub.plan?.name || '',
      planSlug: sub.plan?.slug || '',
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      renewalDate: sub.renewalDate,
      expirationDate: sub.expirationDate,
      gracePeriodEnd: sub.gracePeriodEnd,
      cancelledAt: sub.cancelledAt,
      nextBillingDate: sub.nextBillingDate,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }
}
