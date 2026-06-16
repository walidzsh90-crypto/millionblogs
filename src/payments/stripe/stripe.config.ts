import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config';

@Injectable()
export class StripeConfig {
  constructor(private readonly config: ConfigService) {}

  getSecretKey(): string {
    return this.config.get('STRIPE_SECRET_KEY' as any) as string || 'sk_test_mock';
  }

  getWebhookSecret(): string {
    return this.config.get('STRIPE_WEBHOOK_SECRET' as any) as string || 'whsec_mock';
  }

  getPricePerCredit(): number {
    return Number(this.config.get('STRIPE_PRICE_PER_CREDIT' as any)) || 100; // cents per credit
  }

  getDefaultSuccessUrl(): string {
    return this.config.get('STRIPE_SUCCESS_URL' as any) as string || 'https://millionblogs.com/payment/success';
  }

  getDefaultCancelUrl(): string {
    return this.config.get('STRIPE_CANCEL_URL' as any) as string || 'https://millionblogs.com/payment/cancel';
  }

  isTestMode(): boolean {
    return this.getSecretKey().startsWith('sk_test_');
  }
}
