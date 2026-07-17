import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { InteractionType } from '@prisma/client';

export class CreateInteractionDto {
  @IsUUID()
  @IsNotEmpty()
  contactId: string;

  @IsEnum(InteractionType)
  @IsNotEmpty()
  type: InteractionType;

  @IsString()
  notes: string;
}
