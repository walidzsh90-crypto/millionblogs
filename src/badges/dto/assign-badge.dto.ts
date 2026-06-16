import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class AssignBadgeDto {
  @IsString()
  @IsUUID()
  badgeId: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
