import { IsString, IsInt, IsOptional, Min, IsUUID } from 'class-validator';

export class CreditWalletDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  source: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
