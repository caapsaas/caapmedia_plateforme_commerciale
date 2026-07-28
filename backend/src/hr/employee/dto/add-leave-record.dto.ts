import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LeaveType } from '@prisma/client';

export class AddLeaveRecordDto {
  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  days?: number;

  @IsNotEmpty()
  @IsEnum(LeaveType, { message: 'Invalid leave type' })
  leaveRecordType: LeaveType;
}
