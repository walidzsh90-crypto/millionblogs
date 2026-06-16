import { IsString, IsUUID } from 'class-validator';

export class ClaimFounderDto {
  @IsString()
  @IsUUID()
  programId: string;
}
