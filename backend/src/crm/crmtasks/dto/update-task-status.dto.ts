import { IsEnum, IsNotEmpty } from 'class-validator';
import { CrmTaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsEnum(CrmTaskStatus)
  status: CrmTaskStatus;
}
