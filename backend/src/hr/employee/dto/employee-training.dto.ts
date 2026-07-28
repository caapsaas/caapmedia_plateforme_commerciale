import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEmployeeTrainingDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  trainingName: string;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  trainingDate: Date;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  provider?: string;
}
