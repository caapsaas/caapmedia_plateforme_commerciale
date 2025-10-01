import { IsString, IsDate, IsEnum, IsOptional, Length, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { AbsenceType } from '@prisma/client';

export class CreateAbsenceRecordDto {
  @IsString()
  @Length(1, 255)
  employeeName: string;

  @IsUUID()
  employeeId: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsEnum(AbsenceType)
  typeAbsence: AbsenceType;
}

export class UpdateAbsenceRecordDto extends PartialType(CreateAbsenceRecordDto) {}