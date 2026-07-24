import { IsNumber, Min, Max } from 'class-validator';

export class UpsertCommercialParamsDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  minMarginPercent: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  maxMarginPercent: number;
}
