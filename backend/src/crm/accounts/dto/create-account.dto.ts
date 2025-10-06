import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

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

  @IsUUID()
  @IsOptional()
  salesRepId?: string;

  @IsUUID()
  @IsNotEmpty()
  subsidiaryId?: string;
}
