import { IsString, IsOptional, IsInt, IsBoolean, IsArray, Min, MaxLength } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number = 0;

  @IsOptional()
  @IsString()
  currency?: string = 'usd';

  @IsOptional()
  @IsString()
  visibility?: string = 'public';

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsBoolean()
  isFree?: boolean = false;

  @IsOptional()
  @IsInt()
  sortOrder?: number = 0;
}
