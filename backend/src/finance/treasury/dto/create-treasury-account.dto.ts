import { IsString, IsNotEmpty, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateTreasuryAccountDto {
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsNumber()
  @IsNotEmpty()
  initialBalance: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsEnum(AccountType)
  @IsNotEmpty()
  accountType: AccountType;
}
