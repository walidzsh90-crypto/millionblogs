import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class ExtendSubscriptionDto {
  @IsInt()
  @Min(1)
  @Max(365)
  extensionDays: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
