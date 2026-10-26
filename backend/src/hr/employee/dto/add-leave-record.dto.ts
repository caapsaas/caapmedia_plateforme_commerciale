import {
  IsDate,
  IsNotEmpty,
  IsInt,
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

  @IsInt()
  @Min(1)
  days: number;

  @IsNotEmpty()
  @IsEnum(LeaveType, { message: 'Invalid leave type' })
  leaveRecordType: LeaveType;
}
