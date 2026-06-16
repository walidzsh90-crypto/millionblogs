import { IsString, IsOptional, IsUrl, MinLength, MaxLength, IsArray, IsIn } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsIn(['en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'tr', 'pl', 'sv', 'da', 'fi', 'nb', 'cs', 'hu', 'ro', 'uk', 'el', 'he', 'th', 'vi'])
  primaryLanguage: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalLanguages?: string[];
}
