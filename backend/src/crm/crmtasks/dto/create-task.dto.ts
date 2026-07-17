import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { CrmTaskStatus, CrmTaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  dueDate: string;

  @IsUUID()
  contactId: string;

  @IsUUID()
  @IsOptional()
  opportunityId?: string;

  @IsEnum(CrmTaskStatus)
  status: CrmTaskStatus;

  @IsEnum(CrmTaskPriority)
  priority: CrmTaskPriority;
}
