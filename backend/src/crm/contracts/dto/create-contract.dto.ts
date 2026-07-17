import {
  IsString,
  IsDateString,
  IsNumber,
  IsEnum,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ContractStatus } from '@prisma/client';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  amount: number;

  @IsEnum(ContractStatus)
  status: ContractStatus;

  @IsUUID()
  clientId: string;
}
