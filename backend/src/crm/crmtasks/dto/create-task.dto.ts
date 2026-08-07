import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
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

  // Contact.id/Opportunity.id sont des ids préfixés custom
  // (generateId(ID_PREFIXES.X)), jamais des UUID — @IsUUID() les rejetait
  // systématiquement en 400 (voir même correctif sur find-all-orders.dto.ts).
  @IsString()
  @IsNotEmpty()
  contactId: string;

  @IsString()
  @IsOptional()
  opportunityId?: string;

  @IsEnum(CrmTaskStatus)
  status: CrmTaskStatus;

  @IsEnum(CrmTaskPriority)
  priority: CrmTaskPriority;
}
