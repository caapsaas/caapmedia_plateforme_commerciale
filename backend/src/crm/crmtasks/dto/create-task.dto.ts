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
  