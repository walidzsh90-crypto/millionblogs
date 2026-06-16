import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CampaignFilterDto {
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled', 'expired'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['article', 'showcase'])
  type?: string;

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
