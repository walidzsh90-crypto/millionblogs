import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateBadgeDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  svgContent?: string;

  @IsOptional()
  @IsString()
  @IsIn(['founder', 'verification', 'achievement', 'custom', 'admin'])
  type?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
