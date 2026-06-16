import { IsString, IsIn, IsOptional } from 'class-validator';

export class AdminUpdateBlogDto {
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'pending_verification', 'verified', 'rejected', 'suspended', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['new', 'verified', 'trusted', 'featured'])
  trustStatus?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
