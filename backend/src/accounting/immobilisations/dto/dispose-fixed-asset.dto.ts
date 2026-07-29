import { IsDateString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class DisposeFixedAssetDto {
  @IsDateString()
  @IsNotEmpty()
  disposalDate: string;

  @IsNumber()
  @Min(0)
  disposalAmount: number;
}
