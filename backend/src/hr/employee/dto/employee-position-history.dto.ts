import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEmployeePositionHistoryDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  employeePosition: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  department?: string;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  endDate?: Date;
}
