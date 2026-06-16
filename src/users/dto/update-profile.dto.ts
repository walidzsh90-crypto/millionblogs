import { IsString, IsOptional, IsBoolean, IsUrl, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, { message: 'Invalid locale format (e.g. "en" or "en-US")' })
  language?: string;

  @IsOptional()
  @Matches(/^[A-Za-z_]+\/[A-Za-z_]+$/, { message: 'Invalid timezone format (e.g. "America/New_York")' })
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  badgeVisibility?: boolean;
}
