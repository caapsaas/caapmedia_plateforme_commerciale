import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

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
}
