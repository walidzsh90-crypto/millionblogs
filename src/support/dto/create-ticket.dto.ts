import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MaxLength(255)
  subject: string;

  @IsOptional()
  @IsString()
  body?: string;
}
