import { IsString, IsDate, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceRecordDto {
  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  employeeName?: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  attendanceDate: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : null)
  arrivalTime?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : null)
  departureTime?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  breakStartTime?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  breakEndTime?: Date;

  @IsOptional()
  @IsString()
  signature?: string;


  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class UpdateAttendanceRecordDto extends PartialType(CreateAttendanceRecordDto) {}