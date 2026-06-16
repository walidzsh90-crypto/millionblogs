import { IsString, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsUUID()
  planId: string;
}
