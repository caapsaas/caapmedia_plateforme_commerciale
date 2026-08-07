import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { BankType } from '@prisma/client';

export class CreateBankDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEnum(BankType)
  @IsNotEmpty()
  type: BankType;
}
