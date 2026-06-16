import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PlanFilterDto {
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  visibility?: string;

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
