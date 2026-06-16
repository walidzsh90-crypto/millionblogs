import { IsString, IsUUID, IsOptional, IsIn, IsInt, Min } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsUUID()
  packageId: string;

  @IsString()
  @IsIn(['article', 'showcase'])
  type: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  creditsBudget?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
