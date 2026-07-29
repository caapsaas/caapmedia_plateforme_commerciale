import { IsEnum, IsInt, Min } from 'class-validator';

export enum AccessDurationUnit {
  HOURS = 'HOURS',
  DAYS = 'DAYS',
}

export class ApproveAccessRequestDto {
  @IsInt()
  @Min(1)
  duration: number;

  @IsEnum(AccessDurationUnit)
  unit: AccessDurationUnit;
}
