import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubscriptionFilterDto {
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'active', 'grace_period', 'expired', 'cancelled', 'suspended'])
  status?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
