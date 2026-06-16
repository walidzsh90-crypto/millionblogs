import { IsString, IsOptional, IsUrl, IsIn, IsArray, MinLength, MaxLength } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  canonicalUrl: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  featuredImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  author?: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'tr', 'pl', 'sv', 'da', 'fi', 'nb', 'cs', 'hu', 'ro', 'uk', 'el', 'he', 'th', 'vi'])
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsString()
  publishedAt?: string;
}
