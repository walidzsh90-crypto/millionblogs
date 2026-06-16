import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsUUID()
  planId: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
