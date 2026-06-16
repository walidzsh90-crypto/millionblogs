import { IsString, IsUUID } from 'class-validator';

export class UpgradeFounderDto {
  @IsString()
  @IsUUID()
  targetProgramId: string;
}
