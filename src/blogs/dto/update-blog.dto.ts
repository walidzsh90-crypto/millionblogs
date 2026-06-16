import { IsString, IsOptional, IsUrl, MaxLength, IsArray, IsIn } from 'class-validator';

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  url?: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'tr', 'pl', 'sv', 'da', 'fi', 'nb', 'cs', 'hu', 'ro', 'uk', 'el', 'he', 'th', 'vi'])
  primaryLanguage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalLanguages?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['public', 'unlisted'])
  visibility?: string;
}
