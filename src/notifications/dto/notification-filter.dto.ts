import { IsOptional, IsString, IsIn, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationFilterDto {
  @IsOptional()
  @IsString()
  @IsIn(['system', 'promotion', 'wallet', 'subscription', 'badge', 'support'])
  type?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;

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
