import { IsString, IsInt, IsOptional, Min, IsIn } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  creditCost: number;

  @IsInt()
  @Min(1)
  duration: number;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['public', 'hidden'])
  visibility?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
