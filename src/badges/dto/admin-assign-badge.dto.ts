import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class AdminAssignBadgeDto {
  @IsString()
  @IsUUID()
  userId: string;

  @IsString()
  @IsUUID()
  badgeId: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
