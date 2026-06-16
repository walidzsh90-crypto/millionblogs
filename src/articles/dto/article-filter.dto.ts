import { IsOptional, IsString, IsIn, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ArticleFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'processing', 'published', 'rejected', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  blogId?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  public?: boolean;

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
