export class PaymentResponseDto {
  id: string;
  userId: string;
  planId: string | null;
  amount: number;
  currency: string;
  status: string;
  stripePaymentId: string | null;
  stripeSessionId: string | null;
  creditsPurchased: number | null;
  completedAt: Date | null;
  failedAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      userId: payment.userId,
      planId: payment.planId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      stripePaymentId: payment.stripePaymentId,
      stripeSessionId: payment.stripeSessionId,
      creditsPurchased: payment.creditsPurchased,
      completedAt: payment.completedAt,
      failedAt: payment.failedAt,
      refundedAt: payment.refundedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
