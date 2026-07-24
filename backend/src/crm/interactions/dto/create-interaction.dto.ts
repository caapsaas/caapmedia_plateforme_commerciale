import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { InteractionType } from '@prisma/client';

export class CreateInteractionDto {
  @IsString()
  @IsNotEmpty()
  contactId: string;

  @IsEnum(InteractionType)
  @IsNotEmpty()
  type: InteractionType;

  @IsString()
  notes: string;
}
