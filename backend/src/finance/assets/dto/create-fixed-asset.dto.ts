import { IsString, IsNotEmpty, IsDateString, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateFixedAssetDto {
  @IsString()
  @IsNotEmpty()
  fixedAssetsName: string;

  @IsDateString()
  @IsNotEmpty()
  acquisitionDate: string;

  @IsNumber()
  @IsPositive()
  acquisitionCost: number;

  @IsNumber()
  @IsPositive()
  depreciationRate: number;

  @IsUUID()
  @IsNotEmpty()
  treasuryAccountId: string;
}
