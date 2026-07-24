import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsNotEmpty()
  industry: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  salesRepId?: string;

  @IsString()
  @IsNotEmpty()
  subsidiaryId?: string;
}
