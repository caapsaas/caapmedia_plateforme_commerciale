import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsDateString,
    IsUUID,
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
  
    @IsUUID()
    contactId: string;
  
    @IsUUID()
    accountId: string;
  
    @IsEnum(OpportunityStage)
    stage: OpportunityStage;
  
    @IsEnum(OpportunitySource)
    @IsOptional()
    sourceOpportunity?: OpportunitySource;
  
    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    productIds?: string[];
  }
  