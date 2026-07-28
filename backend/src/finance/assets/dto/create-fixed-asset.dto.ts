import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsPositive,
  IsOptional,
  Min,
} from 'class-validator';

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

  @IsNumber()
  @Min(0)
  @IsOptional()
  residualValue?: number;

  @IsString()
  @IsNotEmpty()
  treasuryAccountId: string;
}
