import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { OpportunityStage, OpportunitySource } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateOpportunityDto {
  @IsString()
  @IsNotEmpty()
  opportunityName: string;

  @IsNumber()
  @Type(() => Number)
  opportunityValue: number;

  @IsDateString()
  closeDate: string;

  // Contact.id/Account.id/Item.id sont des ids préfixés custom, jamais des
  // UUID — @IsUUID() les rejetait systématiquement en 400.
  @IsString()
  @IsNotEmpty()
  contactId: string;

  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsEnum(OpportunityStage)
  stage: OpportunityStage;

  @IsEnum(OpportunitySource)
  @IsOptional()
  sourceOpportunity?: OpportunitySource;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[];
}
