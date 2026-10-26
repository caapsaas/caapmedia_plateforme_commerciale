import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateWorkingDaysDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  workingDays: number[];
}

export class CreateSubsidiaryHolidayDto {
  @IsDateString()
  date: string;

  @IsString()
  @MaxLength(150)
  name: string;
}
