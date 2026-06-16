import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { PlansRepository } from '../plans/plans.repository';
import { StripeService } from './stripe/stripe.service';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly plansRepository: PlansRepository,
    private readonly stripeService: StripeService,
  ) {}

  async createCheckoutSession(userId: string, dto: CreateCheckoutSessionDto) {
    const plan = await this.plansRepository.findById(dto.planId);
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.isFree) throw new BadRequestException('Cannot purchase a free plan');
    if (plan.status !== 'active') throw new BadRequestException('Plan is not available');

    return this.stripeService.createCheckoutSession({
      userId,
      planId: dto.planId,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  async getUserPayments(userId: string, filter: PaymentFilterDto) {
    const result = await this.paymentsRepository.findByUserId(userId, filter);
    return {
      ...result,
      items: result.items.map((item: any) => PaymentResponseDto.fromEntity(item)),
    };
  }

  async getPayment(id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentsRepository.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return PaymentResponseDto.fromEntity(payment);
  }

  // Admin
  async getAllPayments(filter: PaymentFilterDto) {
    const result = await this.paymentsRepository.findMany(filter);
    return {
      ...result,
      items: result.items.map((item: any) => PaymentResponseDto.fromEntity(item)),
    };
  }

  async getStats() {
    return this.paymentsRepository.getStats();
  }
}
