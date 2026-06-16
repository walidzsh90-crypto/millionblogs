import { IsOptional, IsString, IsInt, Min, IsUrl } from 'class-validator';

export class UpdateFeedDto {
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  syncFrequency?: number;
}
