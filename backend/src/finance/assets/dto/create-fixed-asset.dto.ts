import { IsString, IsNotEmpty, IsDateString, IsNumber, IsPositive } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  treasuryAccountId: string;
}
