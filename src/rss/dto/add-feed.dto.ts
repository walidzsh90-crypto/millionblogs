import { IsString, IsUrl, IsOptional, IsInt, Min } from 'class-validator';

export class AddFeedDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsString()
  blogId?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  syncFrequency?: number;
}
