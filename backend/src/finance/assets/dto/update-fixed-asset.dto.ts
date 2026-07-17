import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsDateString,
} from 'class-validator';

export class UpdateFixedAssetDto {
  @IsString()
  @IsOptional()
  fixedAssetsName?: string;

  @IsDateString()
  @IsOptional()
  acquisitionDate?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  acquisitionCost?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  depreciationRate?: number;
}
