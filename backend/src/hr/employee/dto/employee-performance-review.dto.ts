import { IsString, IsNotEmpty, IsDate, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEmployeePerformanceReviewDto {
  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  reviewDate: Date;

  @IsOptional()
  @IsString()
  reviewer?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  reviewComments?: string;
}
